/**
 * CRUD de tickets de suporte, respostas e anexos.
 * @module support/message
 */

import db from "../db.js";
import { enviarTicketDiscord, enviarRespostaDiscord } from "../discord.js";
import { TICKET } from "../config/constants.js";

// --- Funcoes auxiliares (privadas) ---

/**
 * Resolve a prioridade do ticket com base no tipo de cliente.
 * VIPs, gestores e influencers recebem prioridade alta automaticamente.
 * @param {number|null} userId
 * @param {string} defaultPriority
 * @param {string} defaultPhone
 * @returns {{ priority: string, phone: string }}
 */
function resolveTicketContext(userId, defaultPriority, defaultPhone) {
  if (!userId) return { priority: defaultPriority, phone: defaultPhone };

  try {
    const row = db
      .prepare("SELECT tipo_cliente, phone FROM users WHERE id = ?")
      .get(userId);

    if (!row) return { priority: defaultPriority, phone: defaultPhone };

    const priority = TICKET.VIP_TYPES.includes(row.tipo_cliente)
      ? TICKET.PRIORITIES.HIGH
      : defaultPriority;
    const phone = row.phone || defaultPhone;

    return { priority, phone };
  } catch (err) {
    console.error("Erro ao resolver contexto do ticket:", err.message);
    return { priority: defaultPriority, phone: defaultPhone };
  }
}

/**
 * Salva anexos de um ticket/resposta no banco.
 * @param {number} ticketId
 * @param {Array} files - Arquivos do Multer
 * @returns {Array} Anexos salvos
 */
function saveAttachments(ticketId, files) {
  if (!files || files.length === 0) return [];

  const insert = db.prepare(
    `INSERT INTO support_attachments (ticket_id, filename, path, mimetype)
     VALUES (?, ?, ?, ?)`
  );

  const saved = [];
  for (const file of files) {
    const info = insert.run(ticketId, file.filename, file.path, file.mimetype);
    saved.push({
      id: info.lastInsertRowid,
      ticket_id: ticketId,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
    });
  }
  return saved;
}

/**
 * Busca anexos por ticket_ids e retorna as mensagens com a propriedade attachments.
 * @param {Array} messages
 * @returns {Array}
 */
function attachFilesToMessages(messages) {
  if (messages.length === 0) return messages;

  // Coleta todos os ticket_ids unicos
  const ticketIds = [...new Set(messages.map((m) => m.ticket_id || m.id))];

  // SQLite nao suporta ANY($1) — gera IN (?, ?, ...) dinamicamente
  const placeholders = ticketIds.map(() => "?").join(", ");
  const allAttachments = db
    .prepare(`SELECT * FROM support_attachments WHERE ticket_id IN (${placeholders})`)
    .all(...ticketIds);

  // Agrupa anexos por ticket_id
  const attachmentsByTicket = new Map();
  for (const att of allAttachments) {
    const list = attachmentsByTicket.get(att.ticket_id) || [];
    list.push(att);
    attachmentsByTicket.set(att.ticket_id, list);
  }

  return messages.map((msg) => ({
    ...msg,
    attachments: attachmentsByTicket.get(msg.ticket_id || msg.id) || [],
  }));
}

/**
 * Verifica se o usuario pode acessar o ticket.
 * @param {{ user_id: number }} ticket
 * @param {{ id: number, is_admin: boolean }} user
 * @returns {boolean}
 */
function canAccessTicket(ticket, user) {
  if (!user) return false;
  if (user.is_admin) return true;
  return ticket.user_id != null && ticket.user_id === user.id;
}

/**
 * Busca um ticket por ID. Retorna null se nao encontrado.
 * @param {number|string} ticketId
 * @returns {object|null}
 */
function findTicketById(ticketId) {
  return db
    .prepare("SELECT * FROM support_messages WHERE id = ?")
    .get(ticketId) || null;
}

// --- Handlers exportados ---

/**
 * Cria ticket de suporte (logado ou publico).
 * Funcao unificada: se req.user existir, usa o userId.
 */
function processTicketCreation(req, res, userId = null) {
  const { name, email, subject, title, message, priority, phone } = req.body;
  const ticketSubject = subject || title;
  const files = req.files;

  if (!name || !email || !message || !ticketSubject) {
    return res
      .status(400)
      .json({ error: "Nome, email, assunto e mensagem sao obrigatorios." });
  }

  const ctx = resolveTicketContext(
    userId,
    priority || TICKET.PRIORITIES.MEDIUM,
    phone || "N/A"
  );

  // Insere ticket
  const result = db
    .prepare(
      `INSERT INTO support_messages (name, email, subject, message, priority, phone, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(name, email, ticketSubject, message, ctx.priority, ctx.phone, userId);

  const ticketId = result.lastInsertRowid;
  const ticketCode = `${TICKET.PREFIX}${ticketId}`;

  // Salva codigo formatado
  db.prepare("UPDATE support_messages SET ticket_code = ? WHERE id = ?")
    .run(ticketCode, ticketId);

  // Salva anexos
  saveAttachments(ticketId, files);

  // Notifica Discord (fire-and-forget)
  enviarTicketDiscord({
    id: ticketCode,
    name,
    email,
    title: ticketSubject,
    message,
    priority: ctx.priority,
    phone: ctx.phone,
    files,
  }).catch((err) => console.error("Falha ao notificar Discord:", err.message));

  res.status(201).json({ message: "Ticket criado com sucesso!", id: ticketCode });
}

/** Cria ticket com usuario logado. */
export function createSupportTicket(req, res) {
  const userId = req.user?.id ?? null;
  processTicketCreation(req, res, userId);
}

/** Cria ticket publico (sem login). */
export function saveSupportMessage(req, res) {
  processTicketCreation(req, res, null);
}

/** Lista todas as mensagens de suporte (admin). */
export function getSupportMessages(req, res) {
  const rows = db
    .prepare("SELECT * FROM support_messages ORDER BY created_at DESC")
    .all();
  const withAttachments = attachFilesToMessages(rows);
  res.json(withAttachments);
}

/** Atualiza status e/ou prioridade de um ticket (admin). */
export function updateSupportMessage(req, res) {
  const { id } = req.params;
  const { status, priority } = req.body;

  if (!status && !priority) {
    return res
      .status(400)
      .json({ error: "Forneca status ou prioridade para atualizar." });
  }

  // Valida contra valores permitidos
  const validStatuses = Object.values(TICKET.STATUSES);
  const validPriorities = Object.values(TICKET.PRIORITIES);

  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: `Status invalido. Valores aceitos: ${validStatuses.join(", ")}`,
    });
  }
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({
      error: `Prioridade invalida. Valores aceitos: ${validPriorities.join(", ")}`,
    });
  }

  const fields = [];
  const values = [];

  if (status) {
    fields.push("status = ?");
    values.push(status);
  }
  if (priority) {
    fields.push("priority = ?");
    values.push(priority);
  }

  values.push(id);

  const result = db
    .prepare(`UPDATE support_messages SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Mensagem nao encontrada." });
  }

  const updated = db
    .prepare("SELECT * FROM support_messages WHERE id = ?")
    .get(id);

  res.json(updated);
}

/** Adiciona resposta a um ticket. */
export function addReply(req, res) {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user?.id ?? null;
  const files = req.files;

  if (!message) {
    return res.status(400).json({ error: "Mensagem e obrigatoria." });
  }

  const ticket = findTicketById(id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket nao encontrado." });
  }
  if (!canAccessTicket(ticket, req.user)) {
    return res.status(403).json({ error: "Sem permissao para responder." });
  }

  const senderType = ticket.user_id === userId ? "user" : "support";

  const result = db
    .prepare(
      `INSERT INTO support_replies (ticket_id, user_id, sender_type, message)
       VALUES (?, ?, ?, ?)`
    )
    .run(id, userId, senderType, message);

  const reply = db
    .prepare("SELECT * FROM support_replies WHERE id = ?")
    .get(result.lastInsertRowid);

  reply.attachments = saveAttachments(id, files);

  // Notifica Discord (fire-and-forget)
  const replyForDiscord = { ...reply, files };
  if (req.user?.email) {
    const prefix = senderType === "support" ? "Admin" : "Cliente";
    replyForDiscord.message = `**${prefix} (${req.user.email}):** ${reply.message}`;
  }

  enviarRespostaDiscord(replyForDiscord, ticket).catch((err) =>
    console.error("Falha ao notificar Discord:", err.message)
  );

  res.status(201).json(reply);
}

/** Lista respostas de um ticket. */
export function getTicketReplies(req, res) {
  const { id } = req.params;

  const ticket = findTicketById(id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket nao encontrado." });
  }
  if (!canAccessTicket(ticket, req.user)) {
    return res.status(403).json({ error: "Sem permissao para acessar." });
  }

  const rows = db
    .prepare("SELECT * FROM support_replies WHERE ticket_id = ? ORDER BY created_at ASC")
    .all(id);
  const withAttachments = attachFilesToMessages(rows);
  res.json(withAttachments);
}

/** Lista tickets do usuario logado. */
export function getClientMessages(req, res) {
  const rows = db
    .prepare("SELECT * FROM support_messages WHERE user_id = ? ORDER BY id DESC")
    .all(req.user.id);
  const withAttachments = attachFilesToMessages(rows);
  res.json(withAttachments);
}
