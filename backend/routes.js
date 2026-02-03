/**
 * Rotas da API e configuração do Multer para upload de anexos (tickets de suporte).
 * Agrupa rotas públicas, autenticadas (Bearer) e de administrador.
 * @module routes
 */

import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { adminAuthMiddleware } from "./auth/adminAuthMiddleware.js";
import { authMiddleware } from "./auth/authMiddleware.js";
import { register, getClients } from "./auth/register.js";
import { login, getProfile } from "./auth/login.js";
import {
  saveSupportMessage,
  createSupportTicket,
  getSupportMessages,
  updateSupportMessage,
  addReply,
  getTicketReplies,
  getClientMessages,
} from "./support/message.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Multer (Upload de Arquivos)
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB por arquivo
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    const allowed = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]);
    if (allowed.has(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("Tipo de arquivo não permitido"));
  },
});

// Rotas Públicas
router.post("/register", register);
router.post("/login", login);
router.post(
  "/support/ticket",
  authMiddleware,
  upload.array("attachments", 5),
  createSupportTicket
);
router.post("/support", upload.array("attachments", 5), saveSupportMessage);
router.post(
  "/support/ticket/:id/reply",
  authMiddleware,
  upload.array("attachments", 5),
  addReply
); // Nova rota de resposta
router.get("/support/ticket/:id/replies", authMiddleware, getTicketReplies); // Nova rota de listagem de respostas
// Rota para o cliente listar suas mensagens (Integração com suport_cliente.tsx)
router.get("/support/my-messages", authMiddleware, getClientMessages);

// Rotas Protegidas
router.get("/profile", authMiddleware, getProfile);

// Rotas de Admin (Requer Auth + Admin)
router.get("/admin", authMiddleware, adminAuthMiddleware, (req, res) => {
  res.json({ message: "Bem-vindo, admin 👑" });
});
router.get(
  "/support/messages",
  authMiddleware,
  adminAuthMiddleware,
  getSupportMessages
);
router.put(
  "/support/messages/:id",
  authMiddleware,
  adminAuthMiddleware,
  updateSupportMessage
);

// Rota temporária para listar clientes (Acesse via navegador: http://localhost:3000/clients)
router.get("/clients", authMiddleware, adminAuthMiddleware, getClients);

export default router;
