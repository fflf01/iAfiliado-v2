/**
 * Utilitarios de suporte compartilhados entre SuporteCliente e SuporteAdmin.
 * Elimina duplicacao de mapeamentos de cor/status/mensagens.
 */

import { formatTime } from "@/lib/format";

/** Retorna classes CSS para a cor do status do ticket. */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    aberto: "bg-secondary/10 text-secondary",
    em_andamento: "bg-primary/10 text-primary",
    resolvido: "bg-muted text-muted-foreground",
  };
  return map[status] || "";
}

/** Retorna label legivel para o status. */
export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    aberto: "Aberto",
    em_andamento: "Em Andamento",
    resolvido: "Resolvido",
  };
  return map[status] || status;
}

/** Retorna classes CSS para a cor da prioridade. */
export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    high: "text-red-500",
    medium: "text-yellow-500",
    low: "text-green-500",
  };
  return map[priority] || "";
}

/** Retorna label legivel para a prioridade. */
export function getPriorityLabel(priority: string): string {
  const map: Record<string, string> = {
    high: "Alta",
    medium: "Media",
    low: "Baixa",
  };
  return map[priority] || priority;
}

/** Mapeia resposta da API para formato de mensagem do chat. */
export interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  read: boolean;
  attachments?: string[];
}

export function mapReplyToMessage(reply: {
  id: number;
  message: string;
  sender_type: string;
  created_at: string;
  attachments?: { filename: string }[];
}): ChatMessage {
  return {
    id: `reply-${reply.id}`,
    content: reply.message,
    sender: reply.sender_type,
    timestamp: formatTime(reply.created_at),
    read: true,
    attachments: reply.attachments?.map((a) => a.filename),
  };
}
