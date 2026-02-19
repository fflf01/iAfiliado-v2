import { TICKET } from "../config/constants.js";
import { supportRepository } from "../repositories/supportRepository.js";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../errors/AppError.js";
import { enviarRespostaDiscord, enviarTicketDiscord } from "../discord.js";
import { logger } from "../utils/logger.js";

function canAccessTicket(ticket, user) {
  if (!user) return false;
  if (user.is_admin) return true;
  return ticket.user_id != null && ticket.user_id === user.id;
}

function attachFilesToMessages(messages) {
  if (messages.length === 0) return messages;

  const ticketIds = [...new Set(messages.map((m) => m.ticket_id || m.id))];
  const allAttachments = supportRepository.listAttachmentsByTicketIds(ticketIds);

  const attachmentsByTicket = new Map();
  for (const att of allAttachments) {
    const list = attachmentsByTicket.get(att.ticket_id) || [];
    list.push(att);
    attachmentsByTicket.set(att.ticket_id, list);
  }

  return messages.map((msg) => ({
    ...msg,
    attachments: attachmentsByTicket.get(msg.ticket_id || msg.id) || [],
  }));
}

function resolveTicketContext(userId, defaultPriority, defaultPhone) {
  if (!userId) return { priority: defaultPriority, phone: defaultPhone };

  const row = supportRepository.findUserTicketContext(userId);
  if (!row) return { priority: defaultPriority, phone: defaultPhone };

  const priority = TICKET.VIP_TYPES.includes(row.tipo_cliente)
    ? TICKET.PRIORITIES.HIGH
    : defaultPriority;
  const phone = row.phone || defaultPhone;
  return { priority, phone };
}

function parseTicketId(rawId) {
  const id = Number.parseInt(String(rawId), 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError("ID do ticket invalido.");
  }
  return id;
}

export const supportService = {
  createTicket({ payload, files, userId = null }) {
    const { name, email, subject, title, message, priority, phone } = payload;
    const ticketSubject = subject || title;

    if (!name || !email || !message || !ticketSubject) {
      throw new ValidationError(
        "Nome, email, assunto e mensagem sao obrigatorios.",
      );
    }

    const ctx = resolveTicketContext(
      userId,
      priority || TICKET.PRIORITIES.MEDIUM,
      phone || "N/A",
    );

    const ticketId = supportRepository.createTicket({
      name,
      email,
      subject: ticketSubject,
      message,
      priority: ctx.priority,
      phone: ctx.phone,
      userId,
    });

    const ticketCode = `${TICKET.PREFIX}${ticketId}`;
    supportRepository.updateTicketCode(ticketId, ticketCode);
    supportRepository.saveAttachments(ticketId, files);

    enviarTicketDiscord({
      id: ticketCode,
      name,
      email,
      title: ticketSubject,
      message,
      priority: ctx.priority,
      phone: ctx.phone,
      files,
    }).catch((err) => {
      logger.warn("Falha ao notificar ticket no Discord", {
        error: err.message,
        ticketId: ticketCode,
      });
    });

    return { id: ticketCode };
  },

  listSupportMessages() {
    return attachFilesToMessages(supportRepository.listSupportMessages());
  },

  updateSupportMessage(rawId, payload) {
    const id = parseTicketId(rawId);
    const { status, priority } = payload;

    if (!status && !priority) {
      throw new ValidationError("Forneca status ou prioridade para atualizar.");
    }

    const validStatuses = Object.values(TICKET.STATUSES);
    const validPriorities = Object.values(TICKET.PRIORITIES);

    if (status && !validStatuses.includes(status)) {
      throw new ValidationError(
        `Status invalido. Valores aceitos: ${validStatuses.join(", ")}`,
      );
    }

    if (priority && !validPriorities.includes(priority)) {
      throw new ValidationError(
        `Prioridade invalida. Valores aceitos: ${validPriorities.join(", ")}`,
      );
    }

    const changes = supportRepository.updateSupportMessage(id, { status, priority });
    if (changes === 0) throw new NotFoundError("Mensagem nao encontrada.");
    return supportRepository.findTicketById(id);
  },

  addReply(rawId, payload, user, files) {
    const id = parseTicketId(rawId);
    const { message } = payload;

    if (!message) {
      throw new ValidationError("Mensagem e obrigatoria.");
    }

    const ticket = supportRepository.findTicketById(id);
    if (!ticket) throw new NotFoundError("Ticket nao encontrado.");
    if (!canAccessTicket(ticket, user)) {
      throw new ForbiddenError("Sem permissao para responder.");
    }

    const userId = user?.id ?? null;
    const senderType = ticket.user_id === userId ? "user" : "support";
    const reply = supportRepository.createReply({
      ticketId: id,
      userId,
      senderType,
      message,
    });
    reply.attachments = supportRepository.saveAttachments(id, files);

    const replyForDiscord = { ...reply, files };
    if (user?.email) {
      const prefix = senderType === "support" ? "Admin" : "Cliente";
      replyForDiscord.message = `**${prefix} (${user.email}):** ${reply.message}`;
    }

    enviarRespostaDiscord(replyForDiscord, ticket).catch((err) => {
      logger.warn("Falha ao notificar resposta no Discord", {
        error: err.message,
        ticketId: id,
      });
    });

    return reply;
  },

  getTicketReplies(rawId, user) {
    const id = parseTicketId(rawId);
    const ticket = supportRepository.findTicketById(id);
    if (!ticket) throw new NotFoundError("Ticket nao encontrado.");
    if (!canAccessTicket(ticket, user)) {
      throw new ForbiddenError("Sem permissao para acessar.");
    }
    const replies = supportRepository.listRepliesByTicketId(id);
    return attachFilesToMessages(replies);
  },

  getClientMessages(userId) {
    return attachFilesToMessages(supportRepository.listMessagesByUserId(userId));
  },
};
