/**
 * Hook reativo para estado de autenticacao.
 * Centraliza leitura de token/user e fornece funcao de logout.
 * Expoe a role derivada e helpers de permissao.
 */

import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, getUser, clearAuth } from "@/lib/auth";
import { deriveRole, canAccessAdmin as checkAdminAccess } from "@/lib/permissions";
import type { User } from "@/types";

export function useAuth() {
  const [user] = useState<User | null>(() => getUser());
  const [token] = useState<string | null>(() => getToken());
  const navigate = useNavigate();

  const role = useMemo(() => deriveRole(user), [user]);

  const logout = useCallback(() => {
    clearAuth();
    navigate("/login");
  }, [navigate]);

  return {
    user,
    token,
    role,
    isAuthenticated: !!token,
    isAdmin: !!user?.is_admin,
    isSupport: !!user?.is_support,
    isManager: !!user?.is_manager,
    canAccessAdmin: checkAdminAccess(role),
    logout,
  };
}
