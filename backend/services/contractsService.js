import crypto from "crypto";
import { ValidationError, NotFoundError } from "../errors/AppError.js";
import { contractsRepository } from "../repositories/contractsRepository.js";
import { resolveAdminListLimit } from "../utils/pagination.js";

export const contractsService = {
  requestContract(userId, payload) {
    const platformName = String(payload?.platformName || "").trim();
    if (!platformName) {
      throw new ValidationError("platformName e obrigatorio.");
    }

    const casino = contractsRepository.findCasinoByName(platformName);
    if (!casino) {
      throw new NotFoundError("Casa nao encontrada.");
    }

    const pendingForThisCasa = contractsRepository.countPendingByAffiliateAndCasa(userId, casino.id);
    if (pendingForThisCasa >= 3) {
      throw new ValidationError(
        "Voce ja possui 3 solicitacoes pendentes para esta casa. Aguarde a analise ou aprovacao antes de criar novas.",
      );
    }

    const rawType = payload?.commissionType
      ? String(payload.commissionType).trim().toLowerCase()
      : null;
    const allowedTypes = new Set(["deposito", "cpa", "revshare"]);
    const safeTipo = rawType && allowedTypes.has(rawType) ? rawType : null;

    const id = crypto.randomUUID();
    const row = contractsRepository.insertContract({
      id,
      casaId: casino.id,
      afiliadoId: userId,
      tipo: safeTipo,
      valor: null,
      status: "pendente",
    });
    return { ok: true, id: row.id, status: row.status };
  },

  listPendingContracts(query = {}) {
    const { limit, offset } = resolveAdminListLimit(query);
    const status = String(query?.status || "").trim().toLowerCase();
    if (status === "all") {
      return contractsRepository.listAllContracts({ limit, offset });
    }
    return contractsRepository.listContractsByStatus("pendente", { limit, offset });
  },

  setContractLinkStatus(contractId, payload) {
    const id = String(contractId || "").trim();
    if (!id) throw new ValidationError("ID do contrato invalido.");

    const linkStatus = String(payload?.status || "").trim().toLowerCase();
    if (!["on", "off", "active", "inactive"].includes(linkStatus)) {
      throw new ValidationError("Status do link invalido. Use on/off ou active/inactive.");
    }
    const acStatus = linkStatus === "on" || linkStatus === "active" ? "active" : "inactive";

    const existing = contractsRepository.findContractById(id);
    if (!existing) throw new NotFoundError("Contrato nao encontrado.");
    if (existing.status !== "aprovado") {
      throw new ValidationError("So e possivel alterar link de contrato aprovado.");
    }

    const result = contractsRepository.updateAffiliateCasinoLinkStatus(
      existing.afiliado_id,
      existing.casa_id,
      acStatus,
    );
    return { ok: true, changes: result.changes };
  },

  updateContractStatus(contractId, payload) {
    const id = String(contractId || "").trim();
    if (!id) throw new ValidationError("ID do contrato invalido.");

    const status = String(payload?.status || "").trim().toLowerCase();
    if (!["aprovado", "rejeitado"].includes(status)) {
      throw new ValidationError("Status invalido. Use aprovado ou rejeitado.");
    }

    const existing = contractsRepository.findContractById(id);
    if (!existing) throw new NotFoundError("Contrato nao encontrado.");

    const result = contractsRepository.updateContractStatus(id, status);
    if (result.changes === 0) throw new NotFoundError("Contrato nao encontrado.");

    if (status === "aprovado") {
      const linkUrl = payload?.link != null ? String(payload.link).trim() : null;
      // Sempre insere uma nova linha: mesmo cassino pode ter vários links
      contractsRepository.insertAffiliateCasinoLink({
        id: crypto.randomUUID(),
        userId: existing.afiliado_id,
        casinoId: existing.casa_id,
        status: "active",
        link: linkUrl || null,
      });
    }

    return { ok: true };
  },
};

