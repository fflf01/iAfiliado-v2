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
import { fileURLToPath } from "url";
import routes from "./routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { RATE_LIMIT } from "./config/constants.js";
import db from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV !== "production") {
  const dotenv = await import("dotenv");
  dotenv.config();
}

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET nao definido. Configure no ambiente.");
  process.exit(1);
}

const app = express();
const isProduction = process.env.NODE_ENV === "production";

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
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Muitas requisicoes. Tente novamente mais tarde." },
  }),
);

// --- CORS ---
const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (isProduction && corsOrigins.length === 0) {
  console.warn(
    "AVISO: CORS_ORIGINS nao definido em producao. Todas as origens serao permitidas.",
  );
}

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
      console.warn(`CORS bloqueou origem: ${origin} (permitidas: ${corsOrigins.join(", ")})`);
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
const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

server.on("error", (err) => {
  console.error(
    `Erro critico ao iniciar servidor na porta ${port}:`,
    err.message,
  );
  process.exit(1);
});

// --- Graceful shutdown (fecha DB e conexoes antes de encerrar) ---
function shutdown(signal) {
  console.log(`\n${signal} recebido. Encerrando servidor...`);
  server.close(() => {
    try {
      db.close();
      console.log("Banco SQLite fechado.");
    } catch {
      // banco ja fechado
    }
    console.log("Servidor encerrado.");
    process.exit(0);
  });

  // Forca encerramento apos 10s se o server.close nao completar
  setTimeout(() => {
    console.error("Timeout no shutdown. Forcando encerramento.");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
