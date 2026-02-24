import db from "../db.js";

export const withdrawalsRepository = {
  insert(userId, { id, valor, metodo }) {
    db.prepare(
      `INSERT INTO withdrawal_requests (id, user_id, valor, metodo, status)
       VALUES (?, ?, ?, ?, 'pendente')`,
    ).run(id, userId, valor, metodo || "PIX");
    return db.prepare("SELECT * FROM withdrawal_requests WHERE id = ?").get(id);
  },

  findById(id) {
    return db.prepare("SELECT * FROM withdrawal_requests WHERE id = ?").get(id) || null;
  },

  listByUser(userId) {
    return db
      .prepare(
        `SELECT id, valor, metodo, status, created_at, updated_at
         FROM withdrawal_requests
         WHERE user_id = ?
         ORDER BY created_at DESC`,
      )
      .all(userId);
  },

  listForAdmin(status = null) {
    const sql = `
      SELECT
        wr.id,
        wr.user_id,
        wr.valor,
        wr.metodo,
        wr.status,
        wr.created_at,
        wr.updated_at,
        u.full_name AS user_name,
        u.email AS user_email
      FROM withdrawal_requests wr
      JOIN users u ON u.id = wr.user_id
      ${status ? "WHERE wr.status = ?" : ""}
      ORDER BY wr.created_at DESC
    `;
    const stmt = db.prepare(sql);
    return status ? stmt.all(status) : stmt.all();
  },

  updateStatus(id, status) {
    return db
      .prepare(
        `UPDATE withdrawal_requests SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      )
      .run(status, id);
  },

  getWalletByUserId(userId) {
    return db.prepare("SELECT saldo_disponivel, valor_total_sacado FROM wallet_totals WHERE user_id = ?").get(userId) || null;
  },

  updateWalletOnApproval(userId, valor) {
    const w = this.getWalletByUserId(userId);
    if (!w) return { changes: 0 };
    const saldo = Number(w.saldo_disponivel) || 0;
    const sacado = Number(w.valor_total_sacado) || 0;
    if (saldo < valor) return { changes: 0 };
    return db
      .prepare(
        `UPDATE wallet_totals
         SET saldo_disponivel = ?,
             valor_total_sacado = ?,
             updated_at = datetime('now')
         WHERE user_id = ?`,
      )
      .run(saldo - valor, sacado + valor, userId);
  },
};
