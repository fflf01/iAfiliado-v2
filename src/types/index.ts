/** Tipos centralizados da aplicacao. */

export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone?: string;
  is_admin: boolean;
}

export interface Ticket {
  id: number;
  ticket_code: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  priority: "high" | "medium" | "low";
  status: "aberto" | "em_andamento" | "resolvido";
  phone?: string;
  user_id?: number;
  created_at: string;
  attachments?: Attachment[];
}

export interface Reply {
  id: number;
  ticket_id: number;
  user_id: number;
  sender_type: "user" | "support";
  message: string;
  created_at: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: number;
  ticket_id: number;
  filename: string;
  path: string;
  mimetype: string;
}

export interface ApiError {
  error: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}
