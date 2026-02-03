import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

/**
 * Registra um novo cliente. Valida campos obrigatórios, verifica email/login únicos,
 * faz hash da senha com bcrypt, insere em clients e retorna JWT.
 * @param {import("express").Request} req - Body: name, login, email, password_hash; opcional: phone, Tipo_Cliente, Tele_An, Rede_An
 * @param {import("express").Response} res - 201 { message, user, token } | 400 | 409 | 500
 */
export async function register(req, res) {
  try {
    const {
      name,
      login,
      email,
      password_hash,
      phone,
      Tipo_Cliente,
      Tele_An,
      Rede_An,
    } = req.body;

    if (!name || !login || !email || !password_hash) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes" });
    }

    // Verifica se o email ou login já existem antes de tentar inserir
    const userCheck = await pool.query(
      "SELECT email, login FROM clients WHERE email = $1 OR login = $2",
      [email, login]
    );

    if (userCheck.rows.length > 0) {
      const existingUser = userCheck.rows[0];
      if (existingUser.email === email) {
        return res.status(409).json({ error: "Este e-mail já está em uso." });
      }
      return res.status(409).json({ error: "Este login já está em uso." });
    }

    const hashedPassword = await bcrypt.hash(password_hash, 10);

    const result = await pool.query(
      `
      INSERT INTO clients (name, login, email, password_hash, phone, tipo_cliente, tele_an, rede_an)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, login, email, phone, is_admin
      `,
      [
        name,
        login,
        email,
        hashedPassword,
        phone,
        Tipo_Cliente,
        Tele_An,
        Rede_An,
      ]
    );

    const user = result.rows[0];

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

    return res.status(201).json({
      message: "Usuário registrado com sucesso",
      user,
      token,
    });
  } catch (error) {
    console.error("Erro no register:", error);
    // Código de erro do Postgres para violação de unicidade (Unique violation)
    if (error.code === "23505") {
      if (error.detail && error.detail.includes("email")) {
        return res.status(409).json({ error: "Este e-mail já está em uso." });
      }
      if (error.detail && error.detail.includes("login")) {
        return res.status(409).json({ error: "Este login já está em uso." });
      }
      return res.status(409).json({ error: "Login ou email já está em uso." });
    }
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}

/**
 * Lista todos os clientes (id, name, login, email, phone, is_admin). Rota temporária, sem auth.
 * @param {import("express").Request} req
 * @param {import("express").Response} res - 200 array de clientes | 500
 */
export async function getClients(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, name, login, email, phone, is_admin FROM clients ORDER BY id DESC"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
