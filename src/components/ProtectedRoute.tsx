import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

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
 * Roles sao sempre confirmadas com o backend via /profile (useAuth).
 * Redireciona para /login se nao autenticado, /dashboard se sem permissao.
 */
export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireAdminAccess = false,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isVerifying, canAccessAdmin, isAdmin } = useAuth();

  // Enquanto verifica com o backend, evita piscar UI incorreta
  if (isVerifying) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireAdminAccess && !canAccessAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
