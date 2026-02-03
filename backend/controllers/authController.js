import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { pool } from "../db.js";

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Busca o usuário (Certifique-se de que o nome da coluna é 'password')
    const { rows } = await pool.query(
      "SELECT id, name, email, password, is_admin FROM clients WHERE email = $1",
      [email],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const user = rows[0];

    // 2. Verifica a senha (Ajustado de user.password_hash para user.password)
    const passwordOk = await bcrypt.compare(password, user.password);

    if (!passwordOk) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    // 3. Gera o token JWT
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    // 4. Retorna o token e os dados básicos do usuário (útil para o frontend)
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
