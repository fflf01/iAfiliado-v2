import db from "../db.js";

export const authRepository = {
  findByIdentifier(identifier) {
    return (
      db
        .prepare(
          "SELECT id, username, full_name, email, phone, cpf_cnpj, tipo_cliente, tele_an, rede_an, cadastro_status, password_hash, is_admin, is_support, is_manager, is_blocked, COALESCE(failed_login_attempts, 0) AS failed_login_attempts, locked_until FROM users WHERE email = ? OR username = ?",
        )
        .get(identifier, identifier) || null
    );
  },

  /** Incrementa tentativas falhas e, se atingir threshold, define locked_until. Retorna linha atualizada. */
  incrementFailedAttemptsAndMaybeLock(userId, threshold, lockoutMinutes) {
    db.prepare(
      `UPDATE users SET
        failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1,
        locked_until = CASE WHEN (COALESCE(failed_login_attempts, 0) + 1) >= ? THEN datetime('now', '+' || ? || ' minutes') ELSE locked_until END
        WHERE id = ?`,
    ).run(threshold, lockoutMinutes, userId);
    return db.prepare("SELECT failed_login_attempts, locked_until FROM users WHERE id = ?").get(userId);
  },

  resetFailedAttempts(userId) {
    db.prepare(
      "UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?",
    ).run(userId);
  },

  findPublicById(id) {
    return (
      db
        .prepare(
          "SELECT id, username, full_name, email, phone, cpf_cnpj, tipo_cliente, tele_an, rede_an, cadastro_status, is_admin, is_support, is_manager, is_blocked FROM users WHERE id = ?",
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

  listClients({ limit, offset }) {
    return db
      .prepare(
        "SELECT id, username, full_name, email, phone, cpf_cnpj, tipo_cliente, tele_an, rede_an, cadastro_status, created_at, is_admin, is_support, is_manager FROM users ORDER BY id DESC LIMIT ? OFFSET ?",
      )
      .all(limit, offset);
  },
};
