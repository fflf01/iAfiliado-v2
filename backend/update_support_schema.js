import dotenv from "dotenv";
import { pool } from "./db.js";

dotenv.config();

async function updateSchema() {
  try {
    console.log("🔄 Atualizando esquema da tabela 'support_messages'...");

    // Adiciona a coluna 'status' (unread, read, replied)
    await pool.query(`
      ALTER TABLE support_messages
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'unread';
    `);

    // Adiciona a coluna 'priority' (low, medium, high)
    await pool.query(`
      ALTER TABLE support_messages
      ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
    `);

    // Adiciona a coluna 'phone'
    await pool.query(`
      ALTER TABLE support_messages
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
    `);

    // Adiciona a coluna 'ticket_code' para o ID formatado (ex: SUP-1001)
    await pool.query(`
      ALTER TABLE support_messages
      ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(50);
    `);

    // Cria tabela de respostas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_replies (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES support_messages(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES clients(id),
        sender_type VARCHAR(20) NOT NULL, -- 'user' ou 'support'
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Cria tabela de anexos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_attachments (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER REFERENCES support_messages(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        path VARCHAR(255) NOT NULL,
        mimetype VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log(
      "✅ Tabela 'support_replies' e colunas atualizadas com sucesso!",
    );
  } catch (err) {
    console.error("❌ Erro ao atualizar esquema:", err);
  } finally {
    await pool.end();
  }
}

updateSchema();
