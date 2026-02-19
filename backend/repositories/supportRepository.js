import db from "../db.js";

function saveAttachments(ticketId, files) {
  if (!files || files.length === 0) return [];

  const insert = db.prepare(
    `INSERT INTO support_attachments (ticket_id, filename, path, mimetype)
     VALUES (?, ?, ?, ?)`,
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

export const supportRepository = {
  createTicket({ name, email, subject, message, priority, phone, userId }) {
    const result = db
      .prepare(
        `INSERT INTO support_messages (name, email, subject, message, priority, phone, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(name, email, subject, message, priority, phone, userId);
    return result.lastInsertRowid;
  },

  updateTicketCode(ticketId, ticketCode) {
    db.prepare("UPDATE support_messages SET ticket_code = ? WHERE id = ?").run(
      ticketCode,
      ticketId,
    );
  },

  saveAttachments,

  findUserTicketContext(userId) {
    return (
      db.prepare("SELECT tipo_cliente, phone FROM users WHERE id = ?").get(userId) ||
      null
    );
  },

  findTicketById(ticketId) {
    return (
      db.prepare("SELECT * FROM support_messages WHERE id = ?").get(ticketId) || null
    );
  },

  listSupportMessages() {
    return db
      .prepare("SELECT * FROM support_messages ORDER BY created_at DESC")
      .all();
  },

  updateSupportMessage(ticketId, { status, priority }) {
    let result;
    if (status && priority) {
      result = db
        .prepare(
          "UPDATE support_messages SET status = ?, priority = ? WHERE id = ?",
        )
        .run(status, priority, ticketId);
    } else if (status) {
      result = db
        .prepare("UPDATE support_messages SET status = ? WHERE id = ?")
        .run(status, ticketId);
    } else {
      result = db
        .prepare("UPDATE support_messages SET priority = ? WHERE id = ?")
        .run(priority, ticketId);
    }

    return result.changes;
  },

  createReply({ ticketId, userId, senderType, message }) {
    const result = db
      .prepare(
        `INSERT INTO support_replies (ticket_id, user_id, sender_type, message)
         VALUES (?, ?, ?, ?)`,
      )
      .run(ticketId, userId, senderType, message);

    return (
      db.prepare("SELECT * FROM support_replies WHERE id = ?").get(result.lastInsertRowid) ||
      null
    );
  },

  listRepliesByTicketId(ticketId) {
    return db
      .prepare("SELECT * FROM support_replies WHERE ticket_id = ? ORDER BY created_at ASC")
      .all(ticketId);
  },

  listMessagesByUserId(userId) {
    return db
      .prepare("SELECT * FROM support_messages WHERE user_id = ? ORDER BY id DESC")
      .all(userId);
  },

  listAttachmentsByTicketIds(ticketIds) {
    if (!ticketIds.length) return [];
    const placeholders = ticketIds.map(() => "?").join(", ");
    return db
      .prepare(`SELECT * FROM support_attachments WHERE ticket_id IN (${placeholders})`)
      .all(...ticketIds);
  },
};
