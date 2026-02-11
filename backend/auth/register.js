/**
 * Registro de novos clientes e listagem (admin).
 * @module auth/register
 */

import bcrypt from "bcrypt";
import { pool } from "../db.js";
import { generateToken } from "../utils/jwt.js";
import { AUTH } from "../config/constants.js";

/**
 * Registra um novo cliente. Faz hash da senha, insere no banco e retorna JWT.
 * Validacao de campos e formato e feita pelo express-validator em routes.js.
 * Unicidade e garantida pela constraint do banco (catch no errorHandler).
 * @param {import("express").Request} req
 * @param {import("express").Response} res - 201 { message, user, token }
 */
export async function register(req, res) {
  const { name, login, email, password, phone, Tipo_Cliente, Tele_An, Rede_An } = req.body;

  // Validacao de forca da senha (complementar ao express-validator que valida tamanho)
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res
      .status(400)
      .json({ error: "A senha deve conter pelo menos uma letra e um numero." });
  }

  const hashedPassword = await bcrypt.hash(password, AUTH.SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO clients (name, login, email, password_hash, phone, tipo_cliente, tele_an, rede_an)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, name, login, email, phone, is_admin`,
    [name, login, email, hashedPassword, phone, Tipo_Cliente, Tele_An, Rede_An]
  );

  const user = result.rows[0];
  const token = generateToken(user);

  return res.status(201).json({
    message: "Usuario registrado com sucesso.",
    user,
    token,
  });
}

/**
 * Lista todos os clientes (admin).
 * @param {import("express").Request} req
 * @param {import("express").Response} res - 200 array de clientes
 */
export async function getClients(req, res) {
  const result = await pool.query(
    "SELECT id, name, login, email, phone, is_admin FROM clients ORDER BY id DESC"
  );
  res.json(result.rows);
}
