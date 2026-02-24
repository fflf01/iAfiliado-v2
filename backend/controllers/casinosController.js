import { casinosService } from "../services/casinosService.js";

// GET /casinos (public)
export function listPublicCasinos(_req, res) {
  return res.json(casinosService.listPublicCasinos());
}

