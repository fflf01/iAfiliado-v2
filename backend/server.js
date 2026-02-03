/**
 * Ponto de entrada do servidor Express.
 * Configura CORS, JSON, pasta de uploads estáticos e monta as rotas da API.
 * @module server
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes.js";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET não definido. Configure no .env antes de iniciar.");
  process.exit(1);
}

const corsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.length === 0) {
        return callback(null, true);
      }
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origem não permitida pelo CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

const uploadsPath = path.join(__dirname, "uploads");
console.log("O servidor está procurando imagens em:", uploadsPath);

app.use("/uploads", express.static(uploadsPath));

app.use(routes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Arquivo excede 5MB" });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ error: "Limite de arquivos excedido" });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err?.message === "Tipo de arquivo não permitido") {
    return res.status(400).json({ error: err.message });
  }
  return next(err);
});

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
