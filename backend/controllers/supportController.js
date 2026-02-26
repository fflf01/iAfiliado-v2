import { supportService } from "../services/supportService.js";
import { adminLogService } from "../services/adminLogService.js";

export function createSupportTicket(req, res) {
  const result = supportService.createTicket({
    payload: req.body,
    files: req.files,
    userId: req.user?.id ?? null,
  });
  return res.status(201).json({ message: "Ticket criado com sucesso!", id: result.id });
}

export function saveSupportMessage(req, res) {
  const result = supportService.createTicket({
    payload: req.body,
    files: req.files,
    userId: null,
  });
  return res.status(201).json({ message: "Ticket criado com sucesso!", id: result.id });
}

export function getSupportMessages(req, res) {
  return res.json(supportService.listSupportMessages(req.query));
}

export function updateSupportMessage(req, res) {
  const updated = supportService.updateSupportMessage(req.params.id, req.body);
  adminLogService.tryLog(req, {
    action: "support_message_update",
    targetType: "support_message",
    targetId: req.params.id,
    payload: req.body,
  });
  return res.json(updated);
}

export function addReply(req, res) {
  const reply = supportService.addReply(req.params.id, req.body, req.user, req.files);
  return res.status(201).json(reply);
}

export function getTicketReplies(req, res) {
  const replies = supportService.getTicketReplies(req.params.id, req.user, req.query);
  return res.json(replies);
}

export function getClientMessages(req, res) {
  return res.json(supportService.getClientMessages(req.user.id, req.query));
}
