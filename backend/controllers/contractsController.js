import { contractsService } from "../services/contractsService.js";

// POST /me/contracts
export function requestMyContract(req, res) {
  const out = contractsService.requestContract(req.user.id, req.body);
  return res.status(201).json(out);
}

// GET /admin/contracts?status=pendente
export function listPendingContracts(_req, res) {
  return res.json(contractsService.listPendingContracts());
}

// PUT /admin/contracts/:id/status
export function updateContractStatus(req, res) {
  return res.json(contractsService.updateContractStatus(req.params.id, req.body));
}

