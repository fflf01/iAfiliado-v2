import crypto from "crypto";
import { NotFoundError, ValidationError } from "../errors/AppError.js";
import { adminRepository } from "../repositories/adminRepository.js";

function normalizeCasinoStatus(value) {
  if (!value) return null;
  const normalized = String(value).toLowerCase().trim();
  if (normalized === "active" || normalized === "inactive") return normalized;
  if (normalized === "ativo") return "active";
  if (normalized === "inativo") return "inactive";
  throw new ValidationError("Status do casino invalido. Use ativo/inativo.");
}

function toCasinoUi(row) {
  return {
    id: row.id,
    nome: row.name,
    comissaoCPA: Number(row.comissao_cpa || 0),
    comissaoRevShare: Number(row.comissao_revshare || 0),
    status: row.status === "inactive" ? "inativo" : "ativo",
    urlAfiliado: row.url_afiliado || row.url || "",
  };
}

function parseMs(value) {
  if (value == null || value === "") return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

export const adminService = {
  listCasinos() {
    return adminRepository.listCasinos().map(toCasinoUi);
  },

  createCasino(payload) {
    const nome = String(payload?.nome || "").trim();
    if (!nome) throw new ValidationError("Nome do casino e obrigatorio.");

    const id = crypto.randomUUID();
    const created = adminRepository.createCasino({
      id,
      name: nome,
      url: payload?.urlAfiliado || null,
      urlAfiliado: payload?.urlAfiliado || null,
      comissaoCpa: Number(payload?.comissaoCPA) || 0,
      comissaoRevshare: Number(payload?.comissaoRevShare) || 0,
      status: normalizeCasinoStatus(payload?.status) || "active",
    });

    return toCasinoUi(created);
  },

  updateCasino(id, payload) {
    const casinoId = String(id || "").trim();
    if (!casinoId) throw new ValidationError("ID do casino invalido.");

    const status = payload?.status ? normalizeCasinoStatus(payload.status) : null;
    const comissaoCpa =
      payload?.comissaoCPA === undefined ? null : Number(payload.comissaoCPA) || 0;
    const comissaoRevshare =
      payload?.comissaoRevShare === undefined ? null : Number(payload.comissaoRevShare) || 0;

    const result = adminRepository.updateCasino(casinoId, {
      name: payload?.nome != null ? String(payload.nome).trim() : null,
      url: payload?.urlAfiliado != null ? String(payload.urlAfiliado).trim() : null,
      urlAfiliado: payload?.urlAfiliado != null ? String(payload.urlAfiliado).trim() : null,
      comissaoCpa,
      comissaoRevshare,
      status,
    });

    if (result.changes === 0) throw new NotFoundError("Casino nao encontrado.");
    return toCasinoUi(adminRepository.findCasinoById(casinoId));
  },

  deleteCasino(id) {
    const casinoId = String(id || "").trim();
    if (!casinoId) throw new ValidationError("ID do casino invalido.");
    const result = adminRepository.deleteCasino(casinoId);
    if (result.changes === 0) throw new NotFoundError("Casino nao encontrado.");
    return { ok: true };
  },

  listEntradasAdmin(query) {
    const rows = adminRepository.listEntradasAdmin({
      fromMs: parseMs(query?.from),
      toMs: parseMs(query?.to),
      casinoId: query?.casinoId ? String(query.casinoId) : null,
      userId: query?.userId ? Number(query.userId) : null,
    });

    // Converte cada linha "entradas" em múltiplos eventos para o UI.
    const out = [];
    for (const row of rows) {
      const base = {
        usuario: row.user_full_name,
        email: row.user_email,
        casa: row.casino_name,
        data: new Date(Number(row.data_hora || 0)).toISOString(),
      };

      if (Number(row.depositos) > 0) {
        out.push({ id: `${row.id}-deposito`, ...base, tipo: "deposito", valor: Number(row.depositos) });
      }
      if (Number(row.registros) > 0) {
        out.push({ id: `${row.id}-cpa`, ...base, tipo: "cpa", valor: Number(row.registros) });
      }
      if (Number(row.ftd) > 0) {
        out.push({ id: `${row.id}-ftd`, ...base, tipo: "ftd", valor: Number(row.ftd) });
      }
      if (Number(row.valor_recebido) > 0) {
        out.push({ id: `${row.id}-revshare`, ...base, tipo: "revshare", valor: Number(row.valor_recebido) });
      }
    }

    return out;
  },

  listWalletsAdmin() {
    return adminRepository.listWalletsAdmin().map((row) => {
      const totalRecebido = Number(row.valor_recebido_total || 0);
      const saldoDisponivel = Number(row.saldo_disponivel || 0);
      const totalSacado = Number(row.valor_total_sacado || 0);
      const pendente = Math.max(0, totalRecebido - saldoDisponivel - totalSacado);

      return {
        id: String(row.user_id),
        usuario: row.full_name,
        email: row.email,
        saldoDisponivel,
        saldoPendente: pendente,
        totalSacado,
        ultimaAtividade: row.updated_at || new Date().toISOString(),
      };
    });
  },
};

