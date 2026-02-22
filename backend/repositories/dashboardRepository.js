import db from "../db.js";

/**
 * Repositório para dados do dashboard do usuário (stats e carteira).
 * Todas as consultas são filtradas por user_id.
 */
export const dashboardRepository = {
  /**
   * Retorna totais agregados das entradas do usuário.
   * @param {number} userId
   * @returns {{ totalCliques: number, totalDepositos: number, comissaoTotal: number, totalFtds: number }}
   */
  getStatsByUserId(userId) {
    const row =
      db
        .prepare(
          `SELECT
             COALESCE(SUM(cliques), 0) AS total_cliques,
             COALESCE(SUM(depositos), 0) AS total_depositos,
             COALESCE(SUM(valor_recebido), 0) AS comissao_total,
             COALESCE(SUM(ftd), 0) AS total_ftds
           FROM entradas
           WHERE user_id = ?`,
        )
        .get(userId) || null;

    if (!row) {
      return {
        totalCliques: 0,
        totalDepositos: 0,
        comissaoTotal: 0,
        totalFtds: 0,
      };
    }

    return {
      totalCliques: Number(row.total_cliques) || 0,
      totalDepositos: Number(row.total_depositos) || 0,
      comissaoTotal: Number(row.comissao_total) || 0,
      totalFtds: Number(row.total_ftds) || 0,
    };
  },

  /**
   * Retorna a carteira (wallet_totals) do usuário, se existir.
   * @param {number} userId
   */
  getWalletByUserId(userId) {
    const row = db
      .prepare(
        `SELECT valor_recebido_total, saldo_disponivel, valor_total_sacado, updated_at
         FROM wallet_totals
         WHERE user_id = ?`,
      )
      .get(userId);

    if (!row) {
      return {
        valorRecebidoTotal: 0,
        saldoDisponivel: 0,
        valorTotalSacado: 0,
        updatedAt: null,
      };
    }

    return {
      valorRecebidoTotal: Number(row.valor_recebido_total) || 0,
      saldoDisponivel: Number(row.saldo_disponivel) || 0,
      valorTotalSacado: Number(row.valor_total_sacado) || 0,
      updatedAt: row.updated_at,
    };
  },

  /**
   * Lista entradas do usuário (para dashboard e página Entradas).
   * @param {number} userId
   * @param {{ fromMs?: number, toMs?: number }} opts
   */
  listEntradasByUserId(userId, opts = {}) {
    const conditions = ["e.user_id = ?"];
    const params = [userId];

    if (Number.isFinite(opts.fromMs)) {
      conditions.push("e.data_hora >= ?");
      params.push(opts.fromMs);
    }
    if (Number.isFinite(opts.toMs)) {
      conditions.push("e.data_hora <= ?");
      params.push(opts.toMs);
    }

    const where = `WHERE ${conditions.join(" AND ")}`;

    return db
      .prepare(
        `SELECT
           e.id,
           e.casino_id,
           e.data_hora,
           e.depositos,
           e.cliques,
           e.registros,
           e.ftd,
           e.valor_recebido,
           c.name AS casino_name
         FROM entradas e
         JOIN casinos c ON c.id = e.casino_id
         ${where}
         ORDER BY e.data_hora DESC
         LIMIT 1000`,
      )
      .all(...params);
  },
};
