import { adminService } from "../services/adminService.js";

export function listCasinos(req, res) {
  return res.json(adminService.listCasinos());
}

export function createCasino(req, res) {
  return res.status(201).json(adminService.createCasino(req.body));
}

export function updateCasino(req, res) {
  return res.json(adminService.updateCasino(req.params.id, req.body));
}

export function deleteCasino(req, res) {
  return res.json(adminService.deleteCasino(req.params.id));
}

export function listEntradasAdmin(req, res) {
  return res.json(adminService.listEntradasAdmin(req.query));
}

export function listWalletsAdmin(req, res) {
  return res.json(adminService.listWalletsAdmin());
}

