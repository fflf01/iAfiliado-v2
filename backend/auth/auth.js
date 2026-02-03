import jwt from "jsonwebtoken";

// IMPORTANTE: Use a mesma chave secreta que você usou para gerar o token no login
// O ideal é usar process.env.JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_aqui";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  // O formato esperado é "Bearer <token>", então pegamos a segunda parte
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Acesso negado. Token não fornecido." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified; // Adiciona os dados do usuário (payload do token) à requisição
    next(); // Passa para a próxima função (o controller)
  } catch (err) {
    res.status(403).json({ error: "Token inválido ou expirado." });
  }
}