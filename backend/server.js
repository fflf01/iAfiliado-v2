/**
 * Ponto de entrada do servidor Express.
 * Configura seguranca (helmet, rate-limit, CORS), JSON, uploads e monta as rotas.
 * @module server
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import routes from "./routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { RATE_LIMIT } from "./config/constants.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// --- Validacao de variaveis obrigatorias ---
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET nao definido. Configure no .env antes de iniciar.");
  process.exit(1);
}

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
  console.error("CORS_ORIGINS nao definido em producao. Configure no .env.");
  process.exit(1);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!isProduction && corsOrigins.length === 0)
        return callback(null, true);
      if (corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origem nao permitida pelo CORS"));
    },
    credentials: true,
  }),
);

// --- Body parser com limite ---
app.use(express.json({ limit: "1mb" }));

// --- Uploads estaticos ---
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Rotas ---
app.use(routes);

// --- Error handler centralizado (deve ser o ultimo middleware) ---
app.use(errorHandler);

// --- Inicializa servidor ---
const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  if (!isProduction) console.log(`Servidor rodando na porta ${port}`);
});

if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Servidor local rodando");
  });
}

module.exports = app;
