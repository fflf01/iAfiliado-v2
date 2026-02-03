/**
 * Pool de conexões PostgreSQL.
 * Usa variáveis de ambiente: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD.
 * @module db
 */

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "postgres",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD,
};

if (!dbConfig.password) {
  console.warn(
    "⚠️  Aviso: DB_PASSWORD não está definido nas variáveis de ambiente. Verifique seu arquivo .env"
  );
}

// Log de conexão para ajudar na depuração (sem mostrar a senha)
console.log(
  `🔌 Tentando conectar ao PostgreSQL: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
);

export const pool = new Pool(dbConfig);

pool
  .query("SELECT 1")
  .then(() => console.log("✅ Conectado ao PostgreSQL"))
  .catch((err) =>
    console.error("❌ Erro ao conectar ao PostgreSQL:", err.message)
  );
