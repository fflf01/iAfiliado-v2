import crypto from "crypto";
import { ValidationError, NotFoundError } from "../errors/AppError.js";
import { contractsRepository } from "../repositories/contractsRepository.js";

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

    const id = crypto.randomUUID();
    const row = contractsRepository.insertContract({
      id,
      casaId: casino.id,
      afiliadoId: userId,
      tipo: null,
      valor: null,
      status: "pendente",
    });
    return { ok: true, id: row.id, status: row.status };
  },

  listPendingContracts() {
    return contractsRepository.listContractsByStatus("pendente");
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
      const existingLink = contractsRepository.findAffiliateCasinoLink({
        userId: existing.afiliado_id,
        casinoId: existing.casa_id,
      });
      if (!existingLink) {
        contractsRepository.insertAffiliateCasinoLink({
          id: crypto.randomUUID(),
          userId: existing.afiliado_id,
          casinoId: existing.casa_id,
          status: "active",
          link: linkUrl || null,
        });
      } else if (linkUrl !== null && linkUrl !== "") {
        contractsRepository.updateAffiliateCasinoLink({
          userId: existing.afiliado_id,
          casinoId: existing.casa_id,
          link: linkUrl,
        });
      }
    }

    return { ok: true };
  },
};

