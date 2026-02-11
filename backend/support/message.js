/**
 * CRUD de tickets de suporte, respostas e anexos.
 * @module support/message
 */

import { pool } from "../db.js";
import { enviarTicketDiscord, enviarRespostaDiscord } from "../discord.js";
import { TICKET } from "../config/constants.js";

// --- Funcoes auxiliares (privadas) ---

/**
 * Resolve a prioridade do ticket com base no tipo de cliente.
 * VIPs, gestores e influencers recebem prioridade alta automaticamente.
 * @param {number|null} userId
 * @param {string} defaultPriority
 * @returns {Promise<{ priority: string, phone: string }>}
 */
async function resolveTicketContext(userId, defaultPriority, defaultPhone) {
  if (!userId) return { priority: defaultPriority, phone: defaultPhone };

  try {
    const { rows } = await pool.query(
      "SELECT tipo_cliente, phone FROM clients WHERE id = $1",
      [userId]
    );
    if (rows.length === 0) return { priority: defaultPriority, phone: defaultPhone };

    const { tipo_cliente, phone: dbPhone } = rows[0];
    const priority = TICKET.VIP_TYPES.includes(tipo_cliente)
      ? TICKET.PRIORITIES.HIGH
      : defaultPriority;
    const phone = dbPhone || defaultPhone;

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
 * @returns {Promise<Array>} Anexos salvos com RETURNING *
 */
async function saveAttachments(ticketId, files) {
  if (!files || files.length === 0) return [];

  const saved = [];
  for (const file of files) {
    const { rows } = await pool.query(
      `INSERT INTO support_attachments (ticket_id, filename, path, mimetype)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ticketId, file.filename, file.path, file.mimetype]
    );
    saved.push(rows[0]);
  }
  return saved;
}

/**
 * Busca anexos por ticket_id e retorna as mensagens com a propriedade attachments.
 * @param {Array} messages
 * @returns {Promise<Array>}
 */
async function attachFilesToMessages(messages) {
  if (messages.length === 0) return messages;

  // Coleta todos os ticket_ids unicos para uma unica query
  const ticketIds = [...new Set(messages.map((m) => m.ticket_id || m.id))];
  const { rows: allAttachments } = await pool.query(
    "SELECT * FROM support_attachments WHERE ticket_id = ANY($1)",
    [ticketIds]
  );

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
 * @returns {Promise<object|null>}
 */
async function findTicketById(ticketId) {
  const { rows } = await pool.query(
    "SELECT * FROM support_messages WHERE id = $1",
    [ticketId]
  );
  return rows[0] || null;
}

// --- Handlers exportados ---

/**
 * Cria ticket de suporte (logado ou publico).
 * Funcao unificada: se req.user existir, usa o userId.
 */
async function processTicketCreation(req, res, userId = null) {
  const { name, email, subject, title, message, priority, phone } = req.body;
  const ticketSubject = subject || title;
  const files = req.files;

  if (!name || !email || !message || !ticketSubject) {
    return res
      .status(400)
      .json({ error: "Nome, email, assunto e mensagem sao obrigatorios." });
  }

  const ctx = await resolveTicketContext(
    userId,
    priority || TICKET.PRIORITIES.MEDIUM,
    phone || "N/A"
  );

  // Insere ticket
  const { rows } = await pool.query(
    `INSERT INTO support_messages (name, email, subject, message, priority, phone, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [name, email, ticketSubject, message, ctx.priority, ctx.phone, userId]
  );

  const ticketId = rows[0].id;
  const ticketCode = `${TICKET.PREFIX}${ticketId}`;

  // Salva codigo formatado
  await pool.query(
    "UPDATE support_messages SET ticket_code = $1 WHERE id = $2",
    [ticketCode, ticketId]
  );

  // Salva anexos
  await saveAttachments(ticketId, files);

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
export async function createSupportTicket(req, res) {
  const userId = req.user?.id ?? null;
  await processTicketCreation(req, res, userId);
}

/** Cria ticket publico (sem login). */
export async function saveSupportMessage(req, res) {
  await processTicketCreation(req, res, null);
}

/** Lista todas as mensagens de suporte (admin). */
export async function getSupportMessages(req, res) {
  const { rows } = await pool.query(
    "SELECT * FROM support_messages ORDER BY created_at DESC"
  );
  const withAttachments = await attachFilesToMessages(rows);
  res.json(withAttachments);
}

/** Atualiza status e/ou prioridade de um ticket (admin). */
export async function updateSupportMessage(req, res) {
  const { id } = req.params;
  const { status, priority } = req.body;

  if (!status && !priority) {
    return res
      .status(400)
      .json({ error: "Forneca status ou prioridade para atualizar." });
  }

  const fields = [];
  const values = [];

  if (status) {
    fields.push(`status = $${values.length + 1}`);
    values.push(status);
  }
  if (priority) {
    fields.push(`priority = $${values.length + 1}`);
    values.push(priority);
  }

  values.push(id);

  const { rows, rowCount } = await pool.query(
    `UPDATE support_messages SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );

  if (rowCount === 0) {
    return res.status(404).json({ error: "Mensagem nao encontrada." });
  }

  res.json(rows[0]);
}

/** Adiciona resposta a um ticket. */
export async function addReply(req, res) {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user?.id ?? null;
  const files = req.files;

  if (!message) {
    return res.status(400).json({ error: "Mensagem e obrigatoria." });
  }

  const ticket = await findTicketById(id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket nao encontrado." });
  }
  if (!canAccessTicket(ticket, req.user)) {
    return res.status(403).json({ error: "Sem permissao para responder." });
  }

  const senderType = ticket.user_id === userId ? "user" : "support";

  const { rows } = await pool.query(
    `INSERT INTO support_replies (ticket_id, user_id, sender_type, message)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, userId, senderType, message]
  );

  const reply = rows[0];
  reply.attachments = await saveAttachments(id, files);

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
export async function getTicketReplies(req, res) {
  const { id } = req.params;

  const ticket = await findTicketById(id);
  if (!ticket) {
    return res.status(404).json({ error: "Ticket nao encontrado." });
  }
  if (!canAccessTicket(ticket, req.user)) {
    return res.status(403).json({ error: "Sem permissao para acessar." });
  }

  const { rows } = await pool.query(
    "SELECT * FROM support_replies WHERE ticket_id = $1 ORDER BY created_at ASC",
    [id]
  );
  const withAttachments = await attachFilesToMessages(rows);
  res.json(withAttachments);
}

/** Lista tickets do usuario logado. */
export async function getClientMessages(req, res) {
  const { rows } = await pool.query(
    "SELECT * FROM support_messages WHERE user_id = $1 ORDER BY id DESC",
    [req.user.id]
  );
  const withAttachments = await attachFilesToMessages(rows);
  res.json(withAttachments);
}
