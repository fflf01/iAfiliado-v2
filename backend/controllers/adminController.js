import { adminService } from "../services/adminService.js";
import { adminLogService } from "../services/adminLogService.js";

export function listCasinos(req, res) {
  return res.json(adminService.listCasinos(req.query));
}

export function createCasino(req, res) {
  const created = adminService.createCasino(req.body);
  adminLogService.tryLog(req, {
    action: "casino_create",
    targetType: "casino",
    targetId: created.id,
    payload: req.body,
  });
  return res.status(201).json(created);
}

export function updateCasino(req, res) {
  const updated = adminService.updateCasino(req.params.id, req.body);
  adminLogService.tryLog(req, {
    action: "casino_update",
    targetType: "casino",
    targetId: updated.id,
    payload: { id: req.params.id, body: req.body },
  });
  return res.json(updated);
}

export function deleteCasino(req, res) {
  const out = adminService.deleteCasino(req.params.id);
  adminLogService.tryLog(req, {
    action: "casino_delete",
    targetType: "casino",
    targetId: req.params.id,
  });
  return res.json(out);
}

export function listEntradasAdmin(req, res) {
  return res.json(adminService.listEntradasAdmin(req.query));
}

export function createEntrada(req, res) {
  const out = adminService.createEntrada(req.body);
  adminLogService.tryLog(req, {
    action: "entrada_create",
    targetType: "entrada",
    targetId: out.id,
    payload: req.body,
  });
  return res.status(201).json(out);
}

export function importEntradas(req, res) {
  const out = adminService.importEntradas(req.body);
  adminLogService.tryLog(req, {
    action: "entrada_import",
    targetType: "entrada",
    message: `items=${Array.isArray(req.body?.items) ? req.body.items.length : 0}`,
    payload: { inserted: out.inserted },
  });
  return res.status(201).json(out);
}

export function recomputeWalletTotals(req, res) {
  const out = adminService.recomputeWalletTotals();
  adminLogService.tryLog(req, {
    action: "wallet_recompute",
    targetType: "wallet_totals",
    payload: out,
  });
  return res.json(out);
}

export function listWalletsAdmin(req, res) {
  return res.json(adminService.listWalletsAdmin(req.query));
}

export function updateCadastroStatus(req, res) {
  const out = adminService.updateCadastroStatus(req.params.id, req.body);
  const status = (req.body?.status || "").trim().toLowerCase();
  const message =
    status === "rejeitado"
      ? "Requisição de cadastro recusada"
      : status === "aprovado"
        ? "Requisição de cadastro aprovada"
        : status
          ? `Status alterado para ${status}`
          : null;
  adminLogService.tryLog(req, {
    action: status === "rejeitado" ? "user_cadastro_rejected" : "user_cadastro_status_update",
    targetType: "user",
    targetId: req.params.id,
    message,
    payload: req.body,
  });
  return res.json(out);
}

// --- Usuários (punição/admin) ---
export function listUsersAdmin(req, res) {
  return res.json(adminService.listUsers(req.query));
}

export function blockUserAdmin(req, res) {
  const rawBlocked = req.body?.blocked;
  const blocked =
    typeof rawBlocked === "boolean"
      ? rawBlocked
      : String(rawBlocked).toLowerCase().trim() === "true";
  const updated = adminService.setUserBlocked({
    adminUserId: req.user.id,
    targetUserId: req.params.id,
    blocked,
    reason: req.body?.reason,
  });
  adminLogService.tryLog(req, {
    action: updated.is_blocked ? "user_block" : "user_unblock",
    targetType: "user",
    targetId: req.params.id,
    payload: { blocked: Boolean(updated.is_blocked), reason: req.body?.reason || null },
  });
  return res.json(updated);
}

export function deleteUserAdmin(req, res) {
  const out = adminService.deleteUser({
    adminUserId: req.user.id,
    targetUserId: req.params.id,
  });
  adminLogService.tryLog(req, {
    action: "user_delete",
    targetType: "user",
    targetId: req.params.id,
  });
  return res.json(out);
}

// --- log_admin ---
export function listAdminLogs(req, res) {
  return res.json(adminService.listAdminLogs(req.query));
}

// --- Contas dos managers ---
export function listManagers(req, res) {
  return res.json(adminService.listManagers(req.query));
}

export function getManagerAccounts(req, res) {
  return res.json(adminService.getManagerAccounts(req.params.id, req.query));
}

export function addManagerAccount(req, res) {
  const managedUserId = req.body?.user_id ?? req.body?.userId;
  const out = adminService.addManagerAccount(req.params.id, managedUserId);
  return res.status(out.added ? 201 : 200).json(out);
}

export function removeManagerAccount(req, res) {
  const out = adminService.removeManagerAccount(req.params.id, req.params.userId);
  return res.json(out);
}

