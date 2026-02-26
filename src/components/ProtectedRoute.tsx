import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { getToken, getUser } from "@/lib/auth";
import { deriveRole, canAccessAdmin } from "@/lib/permissions";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Exige is_admin (apenas admin_ceo). */
  requireAdmin?: boolean;
  /** Exige acesso ao painel admin (admin_ceo ou support). */
  requireAdminAccess?: boolean;
}

/**
 * Protege rotas verificando autenticacao e permissoes baseadas em role.
 * Redireciona para /login se nao autenticado, /dashboard se sem permissao.
 */
export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireAdminAccess = false,
}: ProtectedRouteProps) {
  const token = getToken();
  const user = getUser();

  if (!token) {
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
