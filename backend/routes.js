/**
 * Rotas da API, validacao de input e configuracao do Multer.
 * @module routes
 */

import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import { body, param, validationResult } from "express-validator";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ValidationError } from "./errors/AppError.js";
import { adminAuthMiddleware } from "./auth/adminAuthMiddleware.js";
import { authMiddleware } from "./auth/authMiddleware.js";
import { asyncHandler } from "./middleware/errorHandler.js";
import {
  register,
  getClients,
  login,
  getProfile,
} from "./controllers/authController.js";
import {
  saveSupportMessage,
  createSupportTicket,
  getSupportMessages,
  updateSupportMessage,
  addReply,
  getTicketReplies,
  getClientMessages,
} from "./controllers/supportController.js";
import { UPLOAD, RATE_LIMIT, AUTH, TICKET, VALIDATION } from "./config/constants.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isTest = process.env.NODE_ENV === "test";

// --- Rate Limiting para autenticacao ---
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH.WINDOW_MS,
  max: RATE_LIMIT.AUTH.MAX,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de autenticacao. Tente em 15 minutos." },
});

// --- Rate Limiting para suporte (evita spam de tickets) ---
const supportLimiter = rateLimit({
  windowMs: RATE_LIMIT.SUPPORT.WINDOW_MS,
  max: RATE_LIMIT.SUPPORT.MAX,
  skip: () => isTest,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisicoes de suporte. Tente novamente mais tarde." },
});

// --- Multer (Upload de arquivos) ---

/**
 * Sanitiza nome de arquivo removendo caracteres perigosos e paths.
 */
function sanitizeFilename(originalName) {
  const baseName = path.basename(originalName);
  return baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
      const suffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${suffix}-${sanitizeFilename(file.originalname)}`);
    },
  }),
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE, files: UPLOAD.MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (!UPLOAD.ALLOWED_MIMES.has(file.mimetype)) {
      return cb(new Error("Tipo de arquivo não permitido"));
    }

    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowedExtensions = UPLOAD.ALLOWED_EXTENSIONS_BY_MIME[file.mimetype] || [];
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error("Extensao de arquivo invalida para o MIME informado"));
    }

    return cb(null, true);
  },
});

// --- Middleware de validacao ---

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ValidationError(errors.array()[0].msg, errors.array()));
  }
  next();
}

// --- Regras de validacao ---

const registerRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Nome e obrigatorio.")
    .isLength({ max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Nome deve ter no maximo ${VALIDATION.NAME_MAX_LENGTH} caracteres.`)
    .escape(),
  body("login").trim().notEmpty().withMessage("Login e obrigatorio.").escape(),
  body("email").trim().notEmpty().withMessage("Email e obrigatorio.").isEmail().withMessage("Email invalido.").normalizeEmail(),
  body("password").notEmpty().withMessage("Senha e obrigatoria.").isLength({ min: AUTH.MIN_PASSWORD_LENGTH }).withMessage(`Senha deve ter no minimo ${AUTH.MIN_PASSWORD_LENGTH} caracteres.`),
  body("phone").optional().trim().escape(),
  body("Tipo_Cliente").optional().trim().escape(),
  body("Tele_An").optional().trim().escape(),
  body("Rede_An").optional().trim().escape(),
];

const loginRules = [
  body("email").optional().trim().isEmail().withMessage("Email invalido.").normalizeEmail(),
  body("login").optional().trim().escape(),
  body("password").notEmpty().withMessage("Senha e obrigatoria."),
];

const supportRules = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Nome e obrigatorio.")
    .isLength({ max: VALIDATION.NAME_MAX_LENGTH })
    .withMessage(`Nome deve ter no maximo ${VALIDATION.NAME_MAX_LENGTH} caracteres.`)
    .escape(),
  body("email").trim().notEmpty().withMessage("Email e obrigatorio.").isEmail().withMessage("Email invalido.").normalizeEmail(),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Mensagem e obrigatoria.")
    .isLength({ max: VALIDATION.MESSAGE_MAX_LENGTH })
    .withMessage(`Mensagem deve ter no maximo ${VALIDATION.MESSAGE_MAX_LENGTH} caracteres.`),
  body("subject")
    .optional()
    .trim()
    .isLength({ max: VALIDATION.SUBJECT_MAX_LENGTH })
    .withMessage(`Assunto deve ter no maximo ${VALIDATION.SUBJECT_MAX_LENGTH} caracteres.`)
    .escape(),
  body("title")
    .optional()
    .trim()
    .isLength({ max: VALIDATION.SUBJECT_MAX_LENGTH })
    .withMessage(`Titulo deve ter no maximo ${VALIDATION.SUBJECT_MAX_LENGTH} caracteres.`)
    .escape(),
  body("phone").optional().trim().escape(),
  body("priority")
    .optional()
    .trim()
    .isIn(Object.values(TICKET.PRIORITIES))
    .withMessage(`Prioridade invalida. Valores aceitos: ${Object.values(TICKET.PRIORITIES).join(", ")}`),
  body().custom((value) => {
    if (!value?.subject && !value?.title) {
      throw new Error("Informe subject ou title.");
    }
    return true;
  }),
];

const replyRules = [
  param("id").isInt().withMessage("ID do ticket invalido."),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Mensagem e obrigatoria.")
    .isLength({ max: VALIDATION.MESSAGE_MAX_LENGTH })
    .withMessage(`Mensagem deve ter no maximo ${VALIDATION.MESSAGE_MAX_LENGTH} caracteres.`),
];

const ticketIdRule = param("id").isInt().withMessage("ID do ticket invalido.");
const updateTicketRules = [
  ticketIdRule,
  body("status")
    .optional()
    .trim()
    .isIn(Object.values(TICKET.STATUSES))
    .withMessage(`Status invalido. Valores aceitos: ${Object.values(TICKET.STATUSES).join(", ")}`),
  body("priority")
    .optional()
    .trim()
    .isIn(Object.values(TICKET.PRIORITIES))
    .withMessage(`Prioridade invalida. Valores aceitos: ${Object.values(TICKET.PRIORITIES).join(", ")}`),
  body().custom((value) => {
    if (!value?.status && !value?.priority) {
      throw new Error("Forneca status ou prioridade para atualizar.");
    }
    return true;
  }),
];

// --- Rotas publicas (com rate limiting e validacao) ---
router.post("/register", authLimiter, registerRules, handleValidationErrors, asyncHandler(register));
router.post("/login", authLimiter, loginRules, handleValidationErrors, asyncHandler(login));

// --- Rotas de suporte ---
router.post("/support", supportLimiter, upload.array("attachments", UPLOAD.MAX_FILES), supportRules, handleValidationErrors, asyncHandler(saveSupportMessage));
router.post("/support/ticket", authMiddleware, supportLimiter, upload.array("attachments", UPLOAD.MAX_FILES), supportRules, handleValidationErrors, asyncHandler(createSupportTicket));
router.post("/support/ticket/:id/reply", authMiddleware, supportLimiter, upload.array("attachments", UPLOAD.MAX_FILES), replyRules, handleValidationErrors, asyncHandler(addReply));
router.get("/support/ticket/:id/replies", authMiddleware, ticketIdRule, handleValidationErrors, asyncHandler(getTicketReplies));
router.get("/support/my-messages", authMiddleware, asyncHandler(getClientMessages));

// --- Rotas protegidas ---
router.get("/profile", authMiddleware, asyncHandler(getProfile));

// --- Rotas de admin ---
router.get("/admin", authMiddleware, adminAuthMiddleware, (_req, res) => {
  res.json({ message: "Bem-vindo, admin." });
});
router.get("/support/messages", authMiddleware, adminAuthMiddleware, asyncHandler(getSupportMessages));
router.put(
  "/support/messages/:id",
  authMiddleware,
  adminAuthMiddleware,
  updateTicketRules,
  handleValidationErrors,
  asyncHandler(updateSupportMessage),
);
router.get("/clients", authMiddleware, adminAuthMiddleware, asyncHandler(getClients));

export default router;
