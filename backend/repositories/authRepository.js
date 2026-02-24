import db from "../db.js";

export const authRepository = {
  findByIdentifier(identifier) {
    return (
      db
        .prepare(
          "SELECT id, username, full_name, email, phone, cpf_cnpj, tipo_cliente, tele_an, rede_an, cadastro_status, password_hash, is_admin, is_blocked FROM users WHERE email = ? OR username = ?",
        )
        .get(identifier, identifier) || null
    );
  },

  findPublicById(id) {
    return (
      db
        .prepare(
          "SELECT id, username, full_name, email, phone, cpf_cnpj, tipo_cliente, tele_an, rede_an, cadastro_status, is_admin, is_blocked FROM users WHERE id = ?",
        )
        .get(id) || null
    );
  },

  findAuthStatusById(id) {
    return db.prepare("SELECT id, is_blocked FROM users WHERE id = ?").get(id) || null;
  },

  insertUser(payload) {
    const cadastroStatus = payload.tipoCliente ? "em_analise" : null;
    const result = db
      .prepare(
        `INSERT INTO users (username, full_name, email, password_hash, phone, cpf_cnpj, tipo_cliente, tele_an, rede_an, cadastro_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        payload.login,
        payload.name,
        payload.email,
        payload.passwordHash,
        payload.phone || null,
        payload.cpfCnpj || null,
        payload.tipoCliente || null,
        payload.teleAn || null,
        payload.redeAn || null,
        cadastroStatus,
      );

    return this.findPublicById(result.lastInsertRowid);
  },

  listClients() {
    return db
      .prepare(
        "SELECT id, username, full_name, email, phone, cpf_cnpj, tipo_cliente, tele_an, rede_an, cadastro_status, created_at, is_admin FROM users ORDER BY id DESC",
      )
      .all();
  },
};
