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
    comissaoDepositoC: Number(row.comissao_depositoc || 0),
    status: row.status === "inactive" ? "inativo" : "ativo",
    urlAfiliado: row.url_afiliado || row.url || "",
  };
}

function parseMs(value) {
  if (value == null || value === "") return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function parseOptionalMs(value, fallback) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toInt(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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
      comissaoDepositoc: Number(payload?.comissaoDepositoC) || 0,
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
    const comissaoDepositoc =
      payload?.comissaoDepositoC === undefined ? null : Number(payload.comissaoDepositoC) || 0;

    const result = adminRepository.updateCasino(casinoId, {
      name: payload?.nome != null ? String(payload.nome).trim() : null,
      url: payload?.urlAfiliado != null ? String(payload.urlAfiliado).trim() : null,
      urlAfiliado: payload?.urlAfiliado != null ? String(payload.urlAfiliado).trim() : null,
      comissaoCpa,
      comissaoRevshare,
      comissaoDepositoc,
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

  createEntrada(payload) {
    const userId = toInt(payload?.userId, 0);
    if (!userId) throw new ValidationError("userId e obrigatorio.");
    const casinoId = String(payload?.casinoId || "").trim();
    if (!casinoId) throw new ValidationError("casinoId e obrigatorio.");

    const id = crypto.randomUUID();
    const dataHora = parseOptionalMs(payload?.dataHora, Date.now());

    const depositos = toInt(payload?.depositos, 0);
    const cliques = toInt(payload?.cliques, 0);
    const registros = toInt(payload?.registros, 0);
    const ftd = toInt(payload?.ftd, 0);
    const valorRecebido = toNumber(payload?.valorRecebido, 0);

    if (
      depositos < 0 ||
      cliques < 0 ||
      registros < 0 ||
      ftd < 0 ||
      valorRecebido < 0
    ) {
      throw new ValidationError("Valores de entrada nao podem ser negativos.");
    }

    adminRepository.insertEntrada({
      id,
      userId,
      casinoId,
      dataHora,
      depositos,
      cliques,
      registros,
      ftd,
      valorRecebido,
    });

    // Alimenta wallet automaticamente quando houver valor_recebido.
    if (valorRecebido > 0) {
      adminRepository.bumpWalletTotals(userId, valorRecebido);
    }

    return { ok: true, id };
  },

  importEntradas(payload) {
    if (!Array.isArray(payload?.items) || payload.items.length === 0) {
      throw new ValidationError("items deve ser um array nao vazio.");
    }

    const now = Date.now();
    const rows = payload.items.map((item) => {
      const userId = toInt(item?.userId, 0);
      if (!userId) throw new ValidationError("items[].userId e obrigatorio.");
      const casinoId = String(item?.casinoId || "").trim();
      if (!casinoId) throw new ValidationError("items[].casinoId e obrigatorio.");

      const valorRecebido = toNumber(item?.valorRecebido, 0);
      const row = {
        id: String(item?.id || crypto.randomUUID()),
        userId,
        casinoId,
        dataHora: parseOptionalMs(item?.dataHora, now),
        depositos: toInt(item?.depositos, 0),
        cliques: toInt(item?.cliques, 0),
        registros: toInt(item?.registros, 0),
        ftd: toInt(item?.ftd, 0),
        valorRecebido,
      };

      if (
        row.depositos < 0 ||
        row.cliques < 0 ||
        row.registros < 0 ||
        row.ftd < 0 ||
        row.valorRecebido < 0
      ) {
        throw new ValidationError("items[] contem valores negativos.");
      }

      return row;
    });

    adminRepository.insertEntradasBulk(rows);

    // Atualiza carteiras (soma por user) — simples e seguro.
    const totalsByUser = new Map();
    for (const row of rows) {
      if (row.valorRecebido <= 0) continue;
      totalsByUser.set(row.userId, (totalsByUser.get(row.userId) || 0) + row.valorRecebido);
    }
    for (const [userId, total] of totalsByUser.entries()) {
      adminRepository.bumpWalletTotals(userId, total);
    }

    return { ok: true, inserted: rows.length };
  },

  recomputeWalletTotals() {
    const updatedUsers = adminRepository.recomputeWalletTotalsFromEntradas();
    return { ok: true, updatedUsers };
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

  updateCadastroStatus(id, payload) {
    const userId = Number.parseInt(String(id), 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new ValidationError("ID do usuario invalido.");
    }

    const status = String(payload?.status || "").trim().toLowerCase();
    const allowed = new Set(["em_analise", "aprovado", "rejeitado"]);
    if (!allowed.has(status)) {
      throw new ValidationError("Status invalido. Use em_analise, aprovado ou rejeitado.");
    }

    const result = adminRepository.updateCadastroStatus(userId, status);
    if (result.changes === 0) throw new NotFoundError("Usuario nao encontrado.");
    return { ok: true };
  },

  // --- Usuários (punição/admin) ---
  listUsers(query) {
    return adminRepository.listUsers({
      q: query?.q ?? query?.query ?? "",
      limit: query?.limit,
    });
  },

  setUserBlocked({ adminUserId, targetUserId, blocked, reason }) {
    const userId = Number.parseInt(String(targetUserId), 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new ValidationError("ID do usuario invalido.");
    }
    if (adminUserId != null && Number(adminUserId) === userId) {
      throw new ValidationError("Voce nao pode bloquear seu proprio usuario.");
    }

    const isBlocked = Boolean(blocked);
    const safeReason = reason == null ? null : String(reason).trim();
    if (safeReason && safeReason.length > 300) {
      throw new ValidationError("Motivo do bloqueio muito longo (max 300).");
    }

    const existing = adminRepository.findUserById(userId);
    if (!existing) throw new NotFoundError("Usuario nao encontrado.");

    const result = adminRepository.setUserBlocked(userId, {
      blocked: isBlocked,
      reason: safeReason,
    });
    if (result.changes === 0) throw new NotFoundError("Usuario nao encontrado.");
    return adminRepository.findUserById(userId);
  },

  deleteUser({ adminUserId, targetUserId }) {
    const userId = Number.parseInt(String(targetUserId), 10);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new ValidationError("ID do usuario invalido.");
    }
    if (adminUserId != null && Number(adminUserId) === userId) {
      throw new ValidationError("Voce nao pode apagar seu proprio usuario.");
    }

    const existing = adminRepository.findUserById(userId);
    if (!existing) throw new NotFoundError("Usuario nao encontrado.");

    const result = adminRepository.deleteUser(userId);
    if (result.changes === 0) throw new NotFoundError("Usuario nao encontrado.");
    return { ok: true };
  },

  // --- Log admin (auditoria) ---
  listAdminLogs(query) {
    return adminRepository.listAdminLogs({
      q: query?.q ?? query?.query ?? "",
      limit: query?.limit,
      offset: query?.offset,
    });
  },

  // --- Contas dos managers ---
  listManagers() {
    return adminRepository.listManagers();
  },

  getManagerAccounts(managerId) {
    const id = Number.parseInt(String(managerId), 10);
    if (!Number.isInteger(id) || id <= 0) throw new ValidationError("ID do manager invalido.");
    const manager = adminRepository.findUserById(id);
    if (!manager) throw new NotFoundError("Manager nao encontrado.");
    if (!manager.is_manager) throw new ValidationError("Usuario nao e manager.");
    return adminRepository.getManagedAccountsWithDetails(id);
  },

  addManagerAccount(managerId, managedUserId) {
    const managerIdNum = Number.parseInt(String(managerId), 10);
    const userIdNum = Number.parseInt(String(managedUserId), 10);
    if (!Number.isInteger(managerIdNum) || managerIdNum <= 0)
      throw new ValidationError("ID do manager invalido.");
    if (!Number.isInteger(userIdNum) || userIdNum <= 0)
      throw new ValidationError("ID do usuario invalido.");
    if (managerIdNum === userIdNum)
      throw new ValidationError("Manager nao pode ser a propria conta gerenciada.");
    const manager = adminRepository.findUserById(managerIdNum);
    if (!manager || !manager.is_manager) throw new NotFoundError("Manager nao encontrado.");
    const user = adminRepository.findUserById(userIdNum);
    if (!user) throw new NotFoundError("Usuario a adicionar nao encontrado.");
    const result = adminRepository.addManagedAccount(managerIdNum, userIdNum);
    return { added: result.changes > 0, accounts: adminRepository.getManagedAccountsWithDetails(managerIdNum) };
  },

  removeManagerAccount(managerId, managedUserId) {
    const managerIdNum = Number.parseInt(String(managerId), 10);
    const userIdNum = Number.parseInt(String(managedUserId), 10);
    if (!Number.isInteger(managerIdNum) || managerIdNum <= 0)
      throw new ValidationError("ID do manager invalido.");
    if (!Number.isInteger(userIdNum) || userIdNum <= 0)
      throw new ValidationError("ID do usuario invalido.");
    const result = adminRepository.removeManagedAccount(managerIdNum, userIdNum);
    return { removed: result.changes > 0, accounts: adminRepository.getManagedAccountsWithDetails(managerIdNum) };
  },
};

