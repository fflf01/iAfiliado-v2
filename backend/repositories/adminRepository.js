import db from "../db.js";

export const adminRepository = {
  // --- Casinos ---
  listCasinos() {
    return db
      .prepare(
        `SELECT id, name, status, url, url_afiliado, comissao_cpa, comissao_revshare
         FROM casinos
         ORDER BY updated_at DESC, created_at DESC`,
      )
      .all();
  },

  createCasino({ id, name, url, urlAfiliado, comissaoCpa, comissaoRevshare, status }) {
    db.prepare(
      `INSERT INTO casinos (id, name, url, url_afiliado, comissao_cpa, comissao_revshare, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      name,
      url || null,
      urlAfiliado || null,
      comissaoCpa || 0,
      comissaoRevshare || 0,
      status || "active",
    );
    return db
      .prepare(
        "SELECT id, name, status, url, url_afiliado, comissao_cpa, comissao_revshare FROM casinos WHERE id = ?",
      )
      .get(id);
  },

  updateCasino(id, { name, url, urlAfiliado, comissaoCpa, comissaoRevshare, status }) {
    const result = db
      .prepare(
        `UPDATE casinos
         SET name = COALESCE(?, name),
             url = COALESCE(?, url),
             url_afiliado = COALESCE(?, url_afiliado),
             comissao_cpa = COALESCE(?, comissao_cpa),
             comissao_revshare = COALESCE(?, comissao_revshare),
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
          "SELECT id, name, status, url, url_afiliado, comissao_cpa, comissao_revshare FROM casinos WHERE id = ?",
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
};

