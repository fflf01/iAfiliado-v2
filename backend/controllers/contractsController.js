import { contractsService } from "../services/contractsService.js";
import { adminLogService } from "../services/adminLogService.js";

// POST /me/contracts
export function requestMyContract(req, res) {
  const out = contractsService.requestContract(req.user.id, req.body);
  return res.status(201).json(out);
}

// GET /admin/contracts
export function listPendingContracts(req, res) {
  return res.json(contractsService.listPendingContracts(req.query));
}

// PUT /admin/contracts/:id/status
export function updateContractStatus(req, res) {
  const out = contractsService.updateContractStatus(req.params.id, req.body);
  adminLogService.tryLog(req, {
    action: "contract_status_update",
    targetType: "contract",
    targetId: req.params.id,
    payload: req.body,
  });
  return res.json(out);
}

// PUT /admin/contracts/:id/link-status (desligar/religar link do contrato aprovado)
export function setContractLinkStatus(req, res) {
  const out = contractsService.setContractLinkStatus(req.params.id, req.body);
  adminLogService.tryLog(req, {
    action: "contract_link_status_update",
    targetType: "contract",
    targetId: req.params.id,
    payload: req.body,
  });
  return res.json(out);
}

