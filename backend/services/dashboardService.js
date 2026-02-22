import { dashboardRepository } from "../repositories/dashboardRepository.js";

/**
 * Serviço para dados do dashboard do usuário autenticado.
 */
export const dashboardService = {
  getMyStats(userId) {
    return dashboardRepository.getStatsByUserId(userId);
  },

  getMyWallet(userId) {
    return dashboardRepository.getWalletByUserId(userId);
  },

  getMyEntradas(userId, query = {}) {
    const fromMs = query.fromMs != null ? Number(query.fromMs) : undefined;
    const toMs = query.toMs != null ? Number(query.toMs) : undefined;
    const rows = dashboardRepository.listEntradasByUserId(userId, { fromMs, toMs });
    return rows.map((row) => ({
      id: row.id,
      casinoId: row.casino_id,
      dataHora: row.data_hora,
      depositos: Number(row.depositos) || 0,
      cliques: Number(row.cliques) || 0,
      registros: Number(row.registros) || 0,
      ftd: Number(row.ftd) || 0,
      valorRecebido: Number(row.valor_recebido) || 0,
      casinoName: row.casino_name,
    }));
  },
};
