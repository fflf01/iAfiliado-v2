import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { getUser } from "@/lib/auth";
import { deriveRole, canAccessAdmin } from "@/lib/permissions";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Exige is_admin (apenas admin_ceo). */
  requireAdmin?: boolean;
  /** Exige acesso ao painel admin (admin_ceo ou support). */
  requireAdminAccess?: boolean;
}

/**
 * Protege rotas verificando autenticacao (user em memoria) e permissoes.
 * Token fica em cookie HttpOnly; presenca do user indica sessao ativa.
 * Redireciona para /login se nao autenticado, /dashboard se sem permissao.
 */
export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireAdminAccess = false,
}: ProtectedRouteProps) {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAdminAccess && !canAccessAdmin(deriveRole(user))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
