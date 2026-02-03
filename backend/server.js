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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const uploadsPath = path.join(__dirname, "../src/assets/uploads");
console.log("O servidor está procurando imagens em:", uploadsPath);

app.use("/uploads", express.static(uploadsPath));

app.use(routes);

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
