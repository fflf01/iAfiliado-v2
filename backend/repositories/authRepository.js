import db from "../db.js";

export const authRepository = {
  findByIdentifier(identifier) {
    return (
      db
        .prepare(
          "SELECT id, username, full_name, email, phone, password_hash, is_admin FROM users WHERE email = ? OR username = ?",
        )
        .get(identifier, identifier) || null
    );
  },

  findPublicById(id) {
    return (
      db
        .prepare(
          "SELECT id, username, full_name, email, phone, is_admin FROM users WHERE id = ?",
        )
        .get(id) || null
    );
  },

  insertUser(payload) {
    const result = db
      .prepare(
        `INSERT INTO users (username, full_name, email, password_hash, phone, tipo_cliente, tele_an, rede_an)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        payload.login,
        payload.name,
        payload.email,
        payload.passwordHash,
        payload.phone || null,
        payload.tipoCliente || null,
        payload.teleAn || null,
        payload.redeAn || null,
      );

    return this.findPublicById(result.lastInsertRowid);
  },

  listClients() {
    return db
      .prepare(
        "SELECT id, username, full_name, email, phone, is_admin FROM users ORDER BY id DESC",
      )
      .all();
  },
};
