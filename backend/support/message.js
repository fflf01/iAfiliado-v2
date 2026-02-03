import { pool } from "../db.js";
import { enviarTicketDiscord, enviarRespostaDiscord } from "../discord.js";

const TICKET_PREFIX = "SUP-";

/**
 * Processa a criação de um ticket (validação, INSERT, anexos, Discord). Uso interno.
 * @private
 * @param {import("express").Request} req - body + req.files (Multer)
 * @param {import("express").Response} res
 * @param {number|null} userId - id do cliente se logado
 */
async function processTicketCreation(req, res, userId = null) {
  // Aceita 'subject' ou 'title' para evitar erros de frontend
  const { name, email, subject, title, message, priority, phone } = req.body;
  const ticketSubject = subject || title;
  const files = req.files; // Arquivos vêm do Multer

  console.log(
    "📂 Processando Novo Ticket. Arquivos recebidos:",
    files ? files.length : 0
  );

  // Validação unificada
  if (!name || !email || !message || !ticketSubject) {
    return res
      .status(400)
      .json({ error: "Nome, email, assunto e mensagem são obrigatórios." });
  }

  let ticketPriority = priority || "medium";
  let ticketPhone = phone || "N/A"; // CORREÇÃO: Alterado de const para let para permitir reatribuição

  // Se o usuário estiver logado, verifica o tipo para definir prioridade VIP
  if (userId) {
    try {
      const userRes = await pool.query(
        "SELECT tipo_cliente, phone FROM clients WHERE id = $1",
        [userId]
      );
      if (userRes.rows.length > 0) {
        const { tipo_cliente, phone: dbPhone } = userRes.rows[0];

        if (dbPhone) {
          ticketPhone = dbPhone;
        }

        // VIPs, Gestores e Influencers ganham prioridade Alta automaticamente
        if (
          ["vip", "gestor_vip", "gestor_afiliados", "influencer"].includes(
            tipo_cliente // CORREÇÃO: Usar a variável desestruturada 'tipo_cliente' em vez de 'userType'
          )
        ) {
          ticketPriority = "high";
        }
      }
    } catch (err) {
      console.error("Erro ao verificar tipo de cliente para prioridade:", err);
    }
  }

  // Persistência no Banco de Dados
  const result = await pool.query(
    `INSERT INTO support_messages (name, email, subject, message, priority, phone, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [name, email, ticketSubject, message, ticketPriority, ticketPhone, userId]
  );

  const ticketId = result.rows[0].id;
  const formattedId = `${TICKET_PREFIX}${ticketId}`;

  // Salva o código formatado (ex: SUP-1001) no banco de dados
  await pool.query(
    "UPDATE support_messages SET ticket_code = $1 WHERE id = $2",
    [formattedId, ticketId]
  );

  // Salvar anexos se houver
  if (files && files.length > 0) {
    for (const file of files) {
      await pool.query(
        `INSERT INTO support_attachments (ticket_id, filename, path, mimetype) VALUES ($1, $2, $3, $4)`,
        [ticketId, file.filename, file.path, file.mimetype]
      );
    }
  }

  // Envio para o Discord (não bloqueia a resposta)
  enviarTicketDiscord({
    id: formattedId,
    name,
    email,
    title: ticketSubject,
    message,
    priority: ticketPriority,
    phone: ticketPhone,
    files: files, // Passa a lista de arquivos para o Discord
  }).catch((err) => console.error("⚠️ Falha ao notificar Discord:", err));

  res
    .status(201)
    .json({ message: "Ticket criado com sucesso!", id: formattedId });
}

/**
 * Cria ticket de suporte com usuário logado. Requer authMiddleware. Prioridade pode ser alta para VIP/gestor/influencer.
 * @param {import("express").Request} req - req.user preenchido; body + req.files (multipart)
 * @param {import("express").Response} res - 201 { message, id } | 400 | 500
 */
export async function createSupportTicket(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    await processTicketCreation(req, res, userId);
  } catch (err) {
    console.error("❌ Erro ao criar ticket:", err);
    res.status(500).json({ error: "Erro interno ao processar ticket." });
  }
}

/**
 * Cria ticket de suporte público (sem login). multipart: name, email, subject/title, message, opcional priority, phone, attachments.
 * @param {import("express").Request} req - body + req.files (Multer)
 * @param {import("express").Response} res - 201 { message, id } | 400 | 500
 */
export async function saveSupportMessage(req, res) {
  try {
    await processTicketCreation(req, res, null);
  } catch (err) {
    console.error("❌ Erro ao salvar mensagem de suporte:", err);
    res.status(500).json({ error: "Erro interno ao enviar mensagem." });
  }
}

/**
 * Associa anexos a cada mensagem (por ticket_id e janela de tempo). Uso interno.
 * @private
 * @param {Array} messages - Lista de mensagens ou respostas
 * @returns {Promise<Array>} Mensagens com propriedade attachments
 */
async function fetchAttachmentsForMessages(messages) {
  if (messages.length === 0) return messages;

  // Para cada mensagem, busca anexos do ticket correspondente criados em um intervalo de tempo próximo
  return await Promise.all(
    messages.map(async (msg) => {
      const msgTime = new Date(msg.created_at).getTime();
      // Busca anexos do ticket
      const attachmentsRes = await pool.query(
        "SELECT * FROM support_attachments WHERE ticket_id = $1",
        [msg.ticket_id || msg.id] // Se for msg principal, o id dela é o ticket_id. Se for resposta, tem ticket_id.
      );

      const attachments = attachmentsRes.rows.filter((att) => {
        const attTime = new Date(att.created_at).getTime();
        // Associa se o anexo foi criado dentro de uma janela de 5 segundos da mensagem
        return Math.abs(attTime - msgTime) < 5000;
      });

      return { ...msg, attachments };
    })
  );
}

/**
 * Lista todas as mensagens de suporte (admin). Requer authMiddleware + adminAuthMiddleware.
 * @param {import("express").Request} req
 * @param {import("express").Response} res - 200 array de mensagens com anexos | 500
 */
export async function getSupportMessages(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM support_messages ORDER BY created_at DESC"
    );
    const messagesWithAttachments = await fetchAttachmentsForMessages(
      result.rows
    );
    res.json(messagesWithAttachments);
  } catch (err) {
    console.error("❌ Erro ao buscar mensagens de suporte:", err);
    res.status(500).json({ error: "Erro interno ao buscar mensagens." });
  }
}

/**
 * Atualiza status e/ou prioridade de um ticket (admin). Requer authMiddleware + adminAuthMiddleware.
 * @param {import("express").Request} req - params.id; body: status e/ou priority
 * @param {import("express").Response} res - 200 mensagem atualizada | 400 | 404 | 500
 */
export async function updateSupportMessage(req, res) {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    if (!status && !priority) {
      return res
        .status(400)
        .json({ error: "Forneça status ou prioridade para atualizar." });
    }

    const fields = [];
    const values = [];

    if (status) {
      fields.push(`status = $${values.length + 1}`);
      values.push(status);
    }
    if (priority) {
      fields.push(`priority = $${values.length + 1}`);
      values.push(priority);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE support_messages SET ${fields.join(", ")} WHERE id = $${
        values.length
      } RETURNING *`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Mensagem não encontrada." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Erro ao atualizar mensagem:", err);
    res.status(500).json({ error: "Erro interno ao atualizar mensagem." });
  }
}

/**
 * Adiciona resposta a um ticket. Requer authMiddleware. multipart: message, opcional attachments.
 * @param {import("express").Request} req - params.id (ticket_id); req.user; body.message; req.files
 * @param {import("express").Response} res - 201 objeto da resposta (com attachments) | 400 | 404 | 500
 */
export async function addReply(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user ? req.user.id : null;
    const files = req.files;

    console.log(
      "📂 Processando Resposta. Arquivos recebidos:",
      files ? files.length : 0
    );

    if (!message) {
      return res.status(400).json({ error: "Mensagem é obrigatória." });
    }

    // Verifica se o ticket existe
    const ticketResult = await pool.query(
      "SELECT * FROM support_messages WHERE id = $1",
      [id]
    );
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: "Ticket não encontrado." });
    }
    const ticket = ticketResult.rows[0];

    // Se quem está respondendo é o dono do ticket, é 'user', senão é 'support' (admin)
    const senderType = ticket.user_id === userId ? "user" : "support";

    // Insere a resposta
    const result = await pool.query(
      `INSERT INTO support_replies (ticket_id, user_id, sender_type, message)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, userId, senderType, message]
    );

    const reply = result.rows[0];

    // Salvar anexos se houver
    const savedAttachments = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const attResult = await pool.query(
          `INSERT INTO support_attachments (ticket_id, filename, path, mimetype) VALUES ($1, $2, $3, $4) RETURNING *`,
          [id, file.filename, file.path, file.mimetype]
        );
        savedAttachments.push(attResult.rows[0]);
      }
    }
    // Anexa os arquivos salvos ao objeto de resposta para o frontend usar imediatamente
    reply.attachments = savedAttachments;

    // Atualiza status do ticket (opcional, ex: reabrir se estava fechado)
    // await pool.query("UPDATE support_messages SET status = 'em_andamento' WHERE id = $1", [id]);

    // Preparar objeto de resposta para o Discord com email de quem enviou
    const replyForDiscord = { ...reply };
    if (req.user && req.user.email) {
      const prefix = senderType === "support" ? "Admin" : "Cliente";
      replyForDiscord.message = `**${prefix} (${req.user.email}):** ${reply.message}`;
    }
    replyForDiscord.files = files;

    // Envia notificação para o Discord
    enviarRespostaDiscord(replyForDiscord, ticket).catch((err) =>
      console.error("⚠️ Falha ao notificar Discord sobre resposta:", err)
    );

    res.status(201).json(reply);
  } catch (err) {
    console.error("❌ Erro ao adicionar resposta:", err);
    res.status(500).json({ error: "Erro interno ao adicionar resposta." });
  }
}

/**
 * Lista respostas de um ticket. Requer authMiddleware.
 * @param {import("express").Request} req - params.id (ticket_id)
 * @param {import("express").Response} res - 200 array de respostas com anexos | 500
 */
export async function getTicketReplies(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT * FROM support_replies WHERE ticket_id = $1 ORDER BY created_at ASC",
      [id]
    );
    const repliesWithAttachments = await fetchAttachmentsForMessages(
      result.rows
    );
    res.json(repliesWithAttachments);
  } catch (err) {
    console.error("❌ Erro ao buscar respostas:", err);
    res.status(500).json({ error: "Erro interno ao buscar respostas." });
  }
}

/**
 * Lista tickets do usuário logado. Requer authMiddleware.
 * @param {import("express").Request} req - req.user.id
 * @param {import("express").Response} res - 200 array de mensagens do usuário com anexos | 500
 */
export async function getClientMessages(req, res) {
  try {
    const result = await pool.query(
      "SELECT * FROM support_messages WHERE user_id = $1 ORDER BY id DESC",
      [req.user.id]
    );
    const messagesWithAttachments = await fetchAttachmentsForMessages(
      result.rows
    );
    res.json(messagesWithAttachments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
