/**
 * Ponto de entrada do servidor Express.
 * Configura seguranca (helmet, rate-limit, CORS), JSON, uploads e monta as rotas.
 * @module server
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { errorHandler } from "./middleware/errorHandler.js";
import { RATE_LIMIT } from "./config/constants.js";
import { loadEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

let env;
try {
  env = loadEnv();
} catch (err) {
  logger.error("Falha na validacao de variaveis de ambiente", {
    error: err.message,
    code: err.code || "ENV_INVALID",
  });
  process.exit(1);
}

const { default: routes } = await import("./routes.js");
const { default: db } = await import("./db.js");

const app = express();
const isProduction = env.isProduction;
const isTest = env.nodeEnv === "test";

// --- Headers de seguranca (helmet) ---
app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
  }),
);

// --- Rate Limiting global ---
app.use(
  rateLimit({
    windowMs: RATE_LIMIT.GLOBAL.WINDOW_MS,
    max: RATE_LIMIT.GLOBAL.MAX,
    skip: () => isTest,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Muitas requisicoes. Tente novamente mais tarde." },
  }),
);

// --- CORS ---
const corsOrigins = env.corsOrigins;

if (!isProduction && corsOrigins.length === 0) {
  logger.warn("CORS_ORIGINS nao definido. Ambiente local permitira todas as origens.");
}

app.use((req, _res, next) => {
  req.requestId = crypto.randomUUID();
  req.log = logger.withContext({
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
  });
  next();
});

app.use((req, res, next) => {
  const startedAt = Date.now();
  req.log.info("Requisicao recebida");
  res.on("finish", () => {
    req.log.info("Requisicao finalizada", {
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?.id,
    });
  });
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Sem Origin (ex: chamadas server-to-server, healthcheck)
      if (!origin) return callback(null, true);
      // Nenhuma origem configurada — aceita tudo
      if (corsOrigins.length === 0) return callback(null, true);
      // Origem na lista de permitidas
      if (corsOrigins.includes(origin)) return callback(null, true);
      // Log para diagnostico antes de rejeitar
      logger.warn("CORS bloqueou origem", {
        origin,
        allowedOrigins: corsOrigins,
      });
      return callback(new Error("Origem nao permitida pelo CORS"));
    },
    credentials: true,
  }),
);

// --- Body parser com limite ---
app.use(express.json({ limit: "1mb" }));

// --- Uploads estaticos ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Health check (antes das rotas — nao requer auth nem rate limit) ---
app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: Math.floor(process.uptime()) });
});

// --- Rotas ---
app.use(routes);

// --- Error handler centralizado (deve ser o ultimo middleware) ---
app.use(errorHandler);

// --- Inicializa servidor ---
const port = env.port;

let server = null;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(port, () => {
    logger.info("Servidor iniciado", { port });
  });
}

if (server) {
  server.on("error", (err) => {
    logger.error("Erro critico ao iniciar servidor", {
      port,
      error: err.message,
    });
    process.exit(1);
  });
}

// --- Graceful shutdown (fecha DB e conexoes antes de encerrar) ---
function shutdown(signal) {
  logger.info("Sinal de encerramento recebido", { signal });
  if (!server) {
    process.exit(0);
  }
  server.close(() => {
    try {
      db.close();
      logger.info("Banco SQLite fechado.");
    } catch {
      // banco ja fechado
    }
    logger.info("Servidor encerrado.");
    process.exit(0);
  });

  // Forca encerramento apos 10s se o server.close nao completar
  setTimeout(() => {
    logger.error("Timeout no shutdown. Forcando encerramento.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
