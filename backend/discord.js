/**
 * Notificações ao Discord via webhook (novos tickets e respostas). Usa DISCORD_WEBHOOK_URL.
 * Requisições usam timeout e AbortController para evitar pendências e liberar recursos.
 * @module discord
 */

import fs from "fs";
import { Blob } from "buffer";
import { logger } from "./utils/logger.js";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const IS_TEST_ENV = process.env.NODE_ENV === "test";

/** Timeout em ms para requisições ao Discord (env: DISCORD_WEBHOOK_TIMEOUT_MS). Cancela a requisição de fato. */
const DISCORD_TIMEOUT_MS = (() => {
  const raw = process.env.DISCORD_WEBHOOK_TIMEOUT_MS;
  if (raw == null || raw === "") return 8_000;
  const n = Number.parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n < 1_000) return 8_000;
  return Math.min(n, 60_000);
})();

/**
 * Cria um AbortSignal que dispara após `ms` milissegundos.
 * Garante liberação do timeout e evita listeners pendentes.
 * @param {number} ms - Timeout em milissegundos
 * @returns {{ signal: AbortSignal, cleanup: () => void }}
 */
function createAbortSignalWithTimeout(ms) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timeoutId);
    },
  };
}

/**
 * Retorna label e cor para exibição da prioridade no Discord.
 * @param {string} [priority] - 'high'/'alta', 'medium'/'média', 'low'/'baixa'
 * @returns {{ label: string, color: number }}
 */
function getPriorityConfig(priority) {
  switch (priority?.toLowerCase()) {
    case "high":
    case "alta":
      return { label: "Alta 🔴", color: 0xef4444 }; // Red
    case "medium":
    case "média":
      return { label: "Média 🟡", color: 0xeab308 }; // Yellow
    case "low":
    case "baixa":
      return { label: "Baixa 🟢", color: 0x22c55e }; // Green
    default:
      return { label: "Normal", color: 0x5865f2 }; // Blurple
  }
}

/**
 * Envia payload (e opcionalmente arquivos) ao webhook do Discord. Não lança erro se URL ausente.
 * Usa timeout e AbortController; ao timeout ou abort, cancela a requisição e libera recursos.
 * @param {object} payload - Objeto JSON enviado como payload_json ou body
 * @param {Array} [files] - Arquivos Multer (path, mimetype, originalname)
 * @param {{ action?: string }} [context] - Ação/endpoint para log (ex: "ticket", "reply")
 */
async function sendToDiscord(payload, files, context = {}) {
  if (IS_TEST_ENV) return;
  if (!DISCORD_WEBHOOK_URL) return;

  const { signal, cleanup } = createAbortSignalWithTimeout(DISCORD_TIMEOUT_MS);
  const action = context.action || "webhook";

  try {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append("payload_json", JSON.stringify(payload));

      const fileBlobs = await Promise.all(
        files.map(async (file) => {
          try {
            const buffer = await fs.promises.readFile(file.path);
            return {
              blob: new Blob([buffer], { type: file.mimetype }),
              originalname: file.originalname,
            };
          } catch (err) {
            logger.warn("Erro ao ler arquivo para Webhook do Discord", {
              action,
              error: err?.message,
            });
            throw err;
          }
        }),
      );

      fileBlobs.forEach((fileBlob, index) => {
        formData.append(`files[${index}]`, fileBlob.blob, fileBlob.originalname);
      });

      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        body: formData,
        signal,
      });
    } else {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal,
      });
    }
  } catch (error) {
    const isAbort = error.name === "AbortError";
    if (isAbort) {
      logger.warn("Timeout na API do Discord", { action, timeoutMs: DISCORD_TIMEOUT_MS });
    } else {
      logger.warn("Falha no Webhook do Discord", { action, error: error.message });
    }
  } finally {
    cleanup();
  }
}

/**
 * Envia notificação de novo ticket ao Discord (embed com prioridade, anexos, etc.).
 * @param {object} ticket - { id, name, email, message, priority, phone, files? }
 */
export async function enviarTicketDiscord(ticket) {
  if (IS_TEST_ENV) return;
  if (!DISCORD_WEBHOOK_URL) return;

  const priorityConfig = getPriorityConfig(ticket.priority);

  const payload = {
    content: `🔔 Novo Ticket Criado: #${ticket.id}`,
    embeds: [
      {
        title: `🎫 Novo Ticket de Suporte, #${ticket.id}`,
        description: ticket.message,
        color: priorityConfig.color,
        fields: [
          { name: "Ticket ID", value: String(ticket.id), inline: true },
          { name: "Nome", value: ticket.name, inline: true },
          { name: "Email", value: ticket.email, inline: true },
          { name: "Telefone", value: ticket.phone || "N/A", inline: true },
          {
            name: "Prioridade",
            value: priorityConfig.label,
            inline: true,
          },

          {
            name: "Anexos",
            value:
              ticket.files && ticket.files.length > 0
                ? ticket.files.map((f) => f.originalname).join("\n")
                : "Nenhum",
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Sistema de Suporte" },
      },
    ],
  };

  if (ticket.files && ticket.files.length > 0) {
    const image = ticket.files.find((f) => f.mimetype.startsWith("image/"));
    if (image) {
      payload.embeds[0].image = { url: `attachment://${image.originalname}` };
    }
  }

  await sendToDiscord(payload, ticket.files, { action: "ticket" });
}

/**
 * Envia notificação de nova resposta ao ticket ao Discord.
 * @param {object} reply - { message, sender_type, files? }
 * @param {object} ticket - { id, subject, title }
 */
export async function enviarRespostaDiscord(reply, ticket) {
  if (IS_TEST_ENV) return;
  if (!DISCORD_WEBHOOK_URL) return;

  const payload = {
    embeds: [
      {
        title: `💬 Nova resposta no Ticket #${ticket.id}`,
        description: reply.message,
        color: 0x00ff00, // Green
        fields: [
          {
            name: "Enviado por",
            value: reply.sender_type === "user" ? "Cliente" : "Suporte",
            inline: true,
          },
          {
            name: "Ticket",
            value: ticket.subject || ticket.title || "Sem assunto",
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Sistema de Suporte" },
      },
    ],
  };

  if (reply.files && reply.files.length > 0) {
    const image = reply.files.find((f) => f.mimetype.startsWith("image/"));
    if (image) {
      payload.embeds[0].image = { url: `attachment://${image.originalname}` };
    }
  }

  await sendToDiscord(payload, reply.files, { action: "reply" });
}
