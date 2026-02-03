export function onlyAdmin(req, res, next) {
  if (!req.user?.is_admin) {
    return res.status(403).json({ error: "Acesso restrito a administradores" });
  }
  next();
}