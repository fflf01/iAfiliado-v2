import db from "../db.js";

export const adminRepository = {
  // --- Casinos ---
  listCasinos() {
    return db
      .prepare(
        `SELECT id, name, status, url, url_afiliado, comissao_cpa, comissao_revshare, comissao_depositoc
         FROM casinos
         ORDER BY updated_at DESC, created_at DESC`,
      )
      .all();
  },

  createCasino({
    id,
    name,
    url,
    urlAfiliado,
    comissaoCpa,
    comissaoRevshare,
    comissaoDepositoc,
    status,
  }) {
    db.prepare(
      `INSERT INTO casinos (id, name, url, url_afiliado, comissao_cpa, comissao_revshare, comissao_depositoc, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      name,
      url || null,
      urlAfiliado || null,
      comissaoCpa || 0,
      comissaoRevshare || 0,
      comissaoDepositoc || 0,
      status || "active",
    );
    return db
      .prepare(
        "SELECT id, name, status, url, url_afiliado, comissao_cpa, comissao_revshare, comissao_depositoc FROM casinos WHERE id = ?",
      )
      .get(id);
  },

  updateCasino(id, {
    name,
    url,
    urlAfiliado,
    comissaoCpa,
    comissaoRevshare,
    comissaoDepositoc,
    status,
  }) {
    const result = db
      .prepare(
        `UPDATE casinos
         SET name = COALESCE(?, name),
             url = COALESCE(?, url),
             url_afiliado = COALESCE(?, url_afiliado),
             comissao_cpa = COALESCE(?, comissao_cpa),
             comissao_revshare = COALESCE(?, comissao_revshare),
             comissao_depositoc = COALESCE(?, comissao_depositoc),
             status = COALESCE(?, status),
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(
        name ?? null,
        url ?? null,
        urlAfiliado ?? null,
        comissaoCpa ?? null,
        comissaoRevshare ?? null,
        comissaoDepositoc ?? null,
        status ?? null,
        id,
      );

    return { changes: result.changes };
  },

  deleteCasino(id) {
    const result = db.prepare("DELETE FROM casinos WHERE id = ?").run(id);
    return { changes: result.changes };
  },

  findCasinoById(id) {
    return (
      db
        .prepare(
          "SELECT id, name, status, url, url_afiliado, comissao_cpa, comissao_revshare, comissao_depositoc FROM casinos WHERE id = ?",
        )
        .get(id) || null
    );
  },

  // --- Entradas (auditoria admin) ---
  listEntradasAdmin({ fromMs, toMs, casinoId, userId }) {
    const conditions = [];
    const params = [];

    if (Number.isFinite(fromMs)) {
      conditions.push("e.data_hora >= ?");
      params.push(fromMs);
    }
    if (Number.isFinite(toMs)) {
      conditions.push("e.data_hora <= ?");
      params.push(toMs);
    }
    if (casinoId) {
      conditions.push("e.casino_id = ?");
      params.push(casinoId);
    }
    if (userId) {
      conditions.push("e.user_id = ?");
      params.push(userId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    return db
      .prepare(
        `SELECT
           e.id,
           e.user_id,
           e.casino_id,
           e.data_hora,
           e.depositos,
           e.cliques,
           e.registros,
           e.ftd,
           e.valor_recebido,
           u.full_name AS user_full_name,
           u.email AS user_email,
           c.name AS casino_name
         FROM entradas e
         JOIN users u ON u.id = e.user_id
         JOIN casinos c ON c.id = e.casino_id
         ${where}
         ORDER BY e.data_hora DESC
         LIMIT 1000`,
      )
      .all(...params);
  },

  insertEntrada({
    id,
    userId,
    casinoId,
    dataHora,
    depositos,
    cliques,
    registros,
    ftd,
    valorRecebido,
  }) {
    db.prepare(
      `INSERT INTO entradas (id, user_id, casino_id, data_hora, depositos, cliques, registros, ftd, valor_recebido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      userId,
      casinoId,
      dataHora,
      depositos,
      cliques,
      registros,
      ftd,
      valorRecebido,
    );
  },

  insertEntradasBulk(rows) {
    const insert = db.prepare(
      `INSERT INTO entradas (id, user_id, casino_id, data_hora, depositos, cliques, registros, ftd, valor_recebido)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const tx = db.transaction((items) => {
      for (const row of items) {
        insert.run(
          row.id,
          row.userId,
          row.casinoId,
          row.dataHora,
          row.depositos,
          row.cliques,
          row.registros,
          row.ftd,
          row.valorRecebido,
        );
      }
    });

    tx(rows);
  },

  bumpWalletTotals(userId, deltaValorRecebido) {
    // Mantem carteira simples: soma em "recebido_total" e "saldo_disponivel".
    // Se você tiver regra de "pendente", dá pra adaptar aqui depois.
    db.prepare(
      `INSERT INTO wallet_totals (user_id, valor_recebido_total, saldo_disponivel, valor_total_sacado)
       VALUES (?, ?, ?, 0)
       ON CONFLICT(user_id) DO UPDATE SET
         valor_recebido_total = wallet_totals.valor_recebido_total + excluded.valor_recebido_total,
         saldo_disponivel = wallet_totals.saldo_disponivel + excluded.saldo_disponivel,
         updated_at = datetime('now')`,
    ).run(userId, deltaValorRecebido, deltaValorRecebido);
  },

  recomputeWalletTotalsFromEntradas() {
    // Recalcula apenas valor_recebido_total com base nas entradas.
    // Nao mexe automaticamente em saques/pagamentos reais.
    const rows = db
      .prepare(
        `SELECT user_id, SUM(valor_recebido) AS total
         FROM entradas
         GROUP BY user_id`,
      )
      .all();

    const upsert = db.prepare(
      `INSERT INTO wallet_totals (user_id, valor_recebido_total, saldo_disponivel, valor_total_sacado)
       VALUES (?, ?, 0, 0)
       ON CONFLICT(user_id) DO UPDATE SET
         valor_recebido_total = excluded.valor_recebido_total,
         updated_at = datetime('now')`,
    );

    const tx = db.transaction((items) => {
      for (const row of items) {
        upsert.run(row.user_id, Number(row.total || 0));
      }
    });

    tx(rows);
    return rows.length;
  },

  // --- Carteiras (wallet_totals) ---
  listWalletsAdmin() {
    return db
      .prepare(
        `SELECT
           w.user_id,
           w.valor_recebido_total,
           w.saldo_disponivel,
           w.valor_total_sacado,
           w.updated_at,
           u.full_name,
           u.email
         FROM wallet_totals w
         JOIN users u ON u.id = w.user_id
         ORDER BY w.updated_at DESC
         LIMIT 1000`,
      )
      .all();
  },

  // --- Solicitações de cadastro (aprovação iAfiliado) ---
  updateCadastroStatus(userId, status) {
    const row = db.prepare("SELECT tipo_cliente FROM users WHERE id = ?").get(userId);
    if (!row) return { changes: 0 };

    const isManager =
      status === "aprovado" &&
      (row.tipo_cliente === "gestor_vip" || row.tipo_cliente === "gestor_afiliados");

    const result = isManager
      ? db
          .prepare(
            `UPDATE users
             SET cadastro_status = ?,
                 is_manager = 1,
                 updated_at = datetime('now')
             WHERE id = ?`,
          )
          .run(status, userId)
      : db
          .prepare(
            `UPDATE users
             SET cadastro_status = ?,
                 updated_at = datetime('now')
             WHERE id = ?`,
          )
          .run(status, userId);

    return { changes: result.changes };
  },

  // --- Usuários (admin) ---
  listUsers({ q, limit = 200 }) {
    const query = String(q || "").trim().toLowerCase();
    const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 200));

    if (!query) {
      return db
        .prepare(
          `SELECT
             id,
             username,
             full_name,
             email,
             phone,
             role,
             is_admin,
             is_support,
             is_manager,
             cadastro_status,
             is_blocked,
             blocked_reason,
             blocked_at,
             created_at,
             updated_at
           FROM users
           ORDER BY id DESC
           LIMIT ?`,
        )
        .all(safeLimit);
    }

    const like = `%${query}%`;
    return db
      .prepare(
        `SELECT
           id,
           username,
           full_name,
           email,
           phone,
           role,
           is_admin,
           is_support,
           is_manager,
           cadastro_status,
           is_blocked,
           blocked_reason,
           blocked_at,
           created_at,
           updated_at
         FROM users
         WHERE lower(username) LIKE ?
            OR lower(full_name) LIKE ?
            OR lower(email) LIKE ?
         ORDER BY id DESC
         LIMIT ?`,
      )
      .all(like, like, like, safeLimit);
  },

  findUserById(userId) {
    return (
      db
        .prepare(
          `SELECT
             id,
             username,
             full_name,
             email,
             phone,
             role,
             is_admin,
             is_support,
             is_manager,
             cadastro_status,
             is_blocked,
             blocked_reason,
             blocked_at,
             created_at,
             updated_at
           FROM users
           WHERE id = ?`,
        )
        .get(userId) || null
    );
  },

  setUserBlocked(userId, { blocked, reason }) {
    const isBlocked = blocked ? 1 : 0;
    const result = db
      .prepare(
        `UPDATE users
         SET is_blocked = ?,
             blocked_reason = ?,
             blocked_at = CASE WHEN ? = 1 THEN datetime('now') ELSE NULL END,
             updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(isBlocked, reason || null, isBlocked, userId);
    return { changes: result.changes };
  },

  deleteUser(userId) {
    const result = db.prepare("DELETE FROM users WHERE id = ?").run(userId);
    return { changes: result.changes };
  },

  // --- Auditoria admin (log_admin) ---
  insertAdminLog({
    adminUserId,
    action,
    targetType,
    targetId,
    message,
    payloadJson,
    ip,
    requestId,
  }) {
    const result = db
      .prepare(
        `INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, message, payload_json, ip, request_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        adminUserId ?? null,
        String(action || "").trim(),
        String(targetType || "").trim(),
        targetId != null ? String(targetId) : null,
        message != null ? String(message) : null,
        payloadJson != null ? String(payloadJson) : null,
        ip != null ? String(ip) : null,
        requestId != null ? String(requestId) : null,
      );
    return result.lastInsertRowid;
  },

  // --- Contas dos managers (quem cada manager pode ver/admin) ---
  listManagers() {
    return db
      .prepare(
        `SELECT id, username, full_name, email, is_manager
         FROM users
         WHERE is_manager = 1
         ORDER BY full_name`,
      )
      .all();
  },

  getManagedAccountIds(managerId) {
    const rows = db
      .prepare(
        `SELECT managed_user_id FROM manager_managed_accounts WHERE manager_id = ? ORDER BY created_at`,
      )
      .all(managerId);
    return rows.map((r) => r.managed_user_id);
  },

  getManagedAccountsWithDetails(managerId) {
    return db
      .prepare(
        `SELECT u.id, u.username, u.full_name, u.email, m.created_at
         FROM manager_managed_accounts m
         JOIN users u ON u.id = m.managed_user_id
         WHERE m.manager_id = ?
         ORDER BY m.created_at`,
      )
      .all(managerId);
  },

  addManagedAccount(managerId, managedUserId) {
    if (Number(managerId) === Number(managedUserId)) {
      return { changes: 0 };
    }
    const result = db
      .prepare(
        `INSERT OR IGNORE INTO manager_managed_accounts (manager_id, managed_user_id) VALUES (?, ?)`,
      )
      .run(managerId, managedUserId);
    return { changes: result.changes };
  },

  removeManagedAccount(managerId, managedUserId) {
    const result = db
      .prepare(
        `DELETE FROM manager_managed_accounts WHERE manager_id = ? AND managed_user_id = ?`,
      )
      .run(managerId, managedUserId);
    return { changes: result.changes };
  },

  listAdminLogs({ q, limit = 200, offset = 0 }) {
    const query = String(q || "").trim().toLowerCase();
    const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 200));
    const safeOffset = Math.max(0, Number(offset) || 0);

    if (!query) {
      return db
        .prepare(
          `SELECT
             l.id,
             l.admin_user_id,
             u.email AS admin_email,
             u.username AS admin_username,
             l.action,
             l.target_type,
             l.target_id,
             l.message,
             l.payload_json,
             l.ip,
             l.request_id,
             l.created_at
           FROM admin_logs l
           LEFT JOIN users u ON u.id = l.admin_user_id
           ORDER BY l.id DESC
           LIMIT ? OFFSET ?`,
        )
        .all(safeLimit, safeOffset);
    }

    const like = `%${query}%`;
    return db
      .prepare(
        `SELECT
           l.id,
           l.admin_user_id,
           u.email AS admin_email,
           u.username AS admin_username,
           l.action,
           l.target_type,
           l.target_id,
           l.message,
           l.payload_json,
           l.ip,
           l.request_id,
           l.created_at
         FROM admin_logs l
         LEFT JOIN users u ON u.id = l.admin_user_id
         WHERE lower(l.action) LIKE ?
            OR lower(l.target_type) LIKE ?
            OR lower(COALESCE(l.target_id, '')) LIKE ?
            OR lower(COALESCE(l.message, '')) LIKE ?
            OR lower(COALESCE(u.email, '')) LIKE ?
         ORDER BY l.id DESC
         LIMIT ? OFFSET ?`,
      )
      .all(like, like, like, like, like, safeLimit, safeOffset);
  },
};

