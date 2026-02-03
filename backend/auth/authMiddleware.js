import jwt from "jsonwebtoken";

/**
 * Middleware que exige header Authorization: Bearer <token>. Verifica o JWT com JWT_SECRET
 * e popula req.user (e req.userId). Responde 401 se token ausente ou inválido.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  // Espera formato "Bearer <token>"
  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return res.status(401).json({ error: "Erro no formato do token" });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ error: "Token malformatado" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, email, is_admin }
    req.userId = decoded.id; // Compatibilidade
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
}
