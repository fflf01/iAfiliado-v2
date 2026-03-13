import { casinosRepository } from "../repositories/casinosRepository.js";

function toPublicCasino(row) {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    urlAfiliado: row.url_afiliado,
    comissaoCpa: Number(row.comissao_cpa || 0),
    comissaoRevshare: Number(row.comissao_revshare || 0),
    comissaoDepositoc: Number(row.comissao_depositoc || 0),
     paymentType: row.payment_type || null,
    description: row.description || null,
  };
}

export const casinosService = {
  listPublicCasinos() {
    return casinosRepository.listActiveCasinos().map(toPublicCasino);
  },
};

