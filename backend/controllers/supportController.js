import { supportService } from "../services/supportService.js";

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
  return res.json(supportService.listSupportMessages());
}

export function updateSupportMessage(req, res) {
  const updated = supportService.updateSupportMessage(req.params.id, req.body);
  return res.json(updated);
}

export function addReply(req, res) {
  const reply = supportService.addReply(req.params.id, req.body, req.user, req.files);
  return res.status(201).json(reply);
}

export function getTicketReplies(req, res) {
  const replies = supportService.getTicketReplies(req.params.id, req.user);
  return res.json(replies);
}

export function getClientMessages(req, res) {
  return res.json(supportService.getClientMessages(req.user.id));
}
