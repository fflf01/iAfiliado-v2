import { dashboardRepository } from "../repositories/dashboardRepository.js";

/**
 * Serviço para dados do dashboard do usuário autenticado.
 */
export const dashboardService = {
  getMyStats(userId, query = {}) {
    const casinoId = typeof query.casinoId === "string" ? query.casinoId : undefined;
    return dashboardRepository.getStatsByUserId(userId, { casinoId });
  },

  getMyWallet(userId) {
    return dashboardRepository.getWalletByUserId(userId);
  },

  getMyCasas(userId) {
    const rows = dashboardRepository.listLinkedCasinosByUserId(userId);
    return rows.map((row) => ({
      casinoId: row.casino_id,
      casinoName: row.casino_name,
      status: row.affiliate_status,
      link: row.affiliate_link,
    }));
  },

  getMyEntradas(userId, query = {}) {
    const fromMs = query.fromMs != null ? Number(query.fromMs) : undefined;
    const toMs = query.toMs != null ? Number(query.toMs) : undefined;
    const casinoId = typeof query.casinoId === "string" ? query.casinoId : undefined;
    const rows = dashboardRepository.listEntradasByUserId(userId, { fromMs, toMs, casinoId });
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
