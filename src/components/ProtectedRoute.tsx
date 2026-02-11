import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { getToken, getUser } from "@/lib/auth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * Protege rotas verificando autenticacao (e opcionalmente permissao admin).
 * Redireciona para /login se nao autenticado.
 */
export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const token = getToken();
  const user = getUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user?.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
