import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

/**
 * Autentica por email ou login e senha. Compara senha com bcrypt e retorna JWT.
 * @param {import("express").Request} req - Body: email ou login, password
 * @param {import("express").Response} res - 200 { message, user, token } | 400 | 401 | 500
 */
export async function login(req, res) {
  try {
    const { email, login, password } = req.body;

    // Identifica se foi enviado email ou login
    const userIdentifier = email || login;

    if (!userIdentifier || !password) {
      return res
        .status(400)
        .json({ error: "Email/Login e password obrigatórios" });
    }

    const result = await pool.query(
      "SELECT id, name, login, email, phone, password_hash, is_admin FROM clients WHERE email = $1 OR login = $1",
      [userIdentifier]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Remove a senha do objeto retornado para segurança
    delete user.password_hash;

    return res.json({
      message: "Login realizado com sucesso",
      user,
      token,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}

/**
 * Retorna o usuário autenticado (payload do JWT em req.user). Requer authMiddleware.
 * @param {import("express").Request} req - req.user preenchido pelo authMiddleware
 * @param {import("express").Response} res - 200 { message, user }
 */
export function getProfile(req, res) {
  res.json({ message: `Usuário autenticado`, user: req.user });
}
