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

    const existing = contractsRepository.findExistingContract({
      afiliadoId: userId,
      casaId: casino.id,
    });
    if (existing) {
      // idempotente: evita spam de solicitacoes duplicadas
      return { ok: true, id: existing.id, status: existing.status };
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
      // Ao aprovar, garante vinculo afiliado <-> casino para aparecer em /me/casas.
      const link = contractsRepository.findAffiliateCasinoLink({
        userId: existing.afiliado_id,
        casinoId: existing.casa_id,
      });
      if (!link) {
        contractsRepository.insertAffiliateCasinoLink({
          id: crypto.randomUUID(),
          userId: existing.afiliado_id,
          casinoId: existing.casa_id,
          status: "active",
        });
      }
    }

    return { ok: true };
  },
};

