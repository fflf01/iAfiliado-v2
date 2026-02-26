/**
 * Sistema centralizado de permissões baseado em roles.
 *
 * Roles:
 *   admin_ceo  – Acesso total: dashboard comum + painel admin completo
 *   support    – Dashboard comum + painel admin limitado (Visão Geral, Solicitações, Entradas, Casinos)
 *   manager    – Dashboard comum + aba "Contas que administro"
 *   user       – Dashboard comum apenas
 */

export type UserRole = "user" | "manager" | "support" | "admin_ceo";

export function deriveRole(user: {
  is_admin?: boolean;
  is_support?: boolean;
  is_manager?: boolean;
} | null): UserRole {
  if (!user) return "user";
  if (user.is_admin) return "admin_ceo";
  if (user.is_support) return "support";
  if (user.is_manager) return "manager";
  return "user";
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === "admin_ceo" || role === "support";
}

const DASHBOARD_VISIBLE: Record<string, UserRole[]> = {
  dashboard: ["user", "manager", "support", "admin_ceo"],
  entradas: ["user", "manager", "support", "admin_ceo"],
  plataformas: ["user", "manager", "support", "admin_ceo"],
  links: ["user", "manager", "support", "admin_ceo"],
  carteira: ["user", "manager", "support", "admin_ceo"],
  contas_manager: ["manager"],
  suporte: ["user", "manager", "support", "admin_ceo"],
};

const ADMIN_VISIBLE: Record<string, UserRole[]> = {
  overview: ["admin_ceo", "support"],
  user_dashboard: ["admin_ceo"],
  solicitacoes: ["admin_ceo", "support"],
  casinos: ["admin_ceo", "support"],
  entradas: ["admin_ceo", "support"],
  carteiras: ["admin_ceo"],
  saques: ["admin_ceo"],
  contas_manager: ["admin_ceo"],
  usuarios: ["admin_ceo"],
  log_admin: ["admin_ceo"],
};

export function canSeeDashboardSection(section: string, role: UserRole): boolean {
  return DASHBOARD_VISIBLE[section]?.includes(role) ?? false;
}

export function canSeeAdminSection(section: string, role: UserRole): boolean {
  return ADMIN_VISIBLE[section]?.includes(role) ?? false;
}

export function getVisibleAdminSections(role: UserRole): string[] {
  return Object.entries(ADMIN_VISIBLE)
    .filter(([, roles]) => roles.includes(role))
    .map(([section]) => section);
}
