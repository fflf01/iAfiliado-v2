/**
 * Notificações ao Discord via webhook (novos tickets e respostas). Usa DISCORD_WEBHOOK_URL.
 * @module discord
 */

import dotenv from "dotenv";
import fs from "fs";
import { Blob } from "buffer";

dotenv.config();

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

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
 * @param {object} payload - Objeto JSON enviado como payload_json ou body
 * @param {Array} [files] - Arquivos Multer (path, mimetype, originalname)
 */
async function sendToDiscord(payload, files) {
  if (!DISCORD_WEBHOOK_URL) return;

  try {
    if (files && files.length > 0) {
      const formData = new FormData();
      formData.append("payload_json", JSON.stringify(payload));

      files.forEach((file, index) => {
        const buffer = fs.readFileSync(file.path);
        const blob = new Blob([buffer], { type: file.mimetype });
        formData.append(`files[${index}]`, blob, file.originalname);
      });

      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        body: formData,
      });
    } else {
      await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  } catch (error) {
    console.error("Falha no Webhook do Discord:", error.message);
  }
}

/**
 * Envia notificação de novo ticket ao Discord (embed com prioridade, anexos, etc.).
 * @param {object} ticket - { id, name, email, message, priority, phone, files? }
 */
export async function enviarTicketDiscord(ticket) {
  if (!DISCORD_WEBHOOK_URL) {
    console.warn("DISCORD_WEBHOOK_URL nao definida no arquivo .env");
    return;
  }

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

  await sendToDiscord(payload, ticket.files);
}

/**
 * Envia notificação de nova resposta ao ticket ao Discord.
 * @param {object} reply - { message, sender_type, files? }
 * @param {object} ticket - { id, subject, title }
 */
export async function enviarRespostaDiscord(reply, ticket) {
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

  await sendToDiscord(payload, reply.files);
}
