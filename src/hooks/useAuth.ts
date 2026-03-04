/**
 * Hook reativo para estado de autenticacao.
 * Centraliza leitura de token/user e fornece funcao de logout.
 * Expoe a role derivada e helpers de permissao.
 */

import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "@/lib/auth";
import { deriveRole, canAccessAdmin as checkAdminAccess } from "@/lib/permissions";
import type { StoredUser } from "@/types";
import { apiPost } from "@/lib/api-client";

export function useAuth() {
  const [user] = useState<StoredUser | null>(() => getUser());
  const navigate = useNavigate();

  const role = useMemo(() => deriveRole(user), [user]);

  const logout = useCallback(async () => {
    try {
      await apiPost("/logout", {});
    } catch {
      // Cookie pode já ter expirado; limpa estado local de qualquer forma
    }
    clearAuth();
    navigate("/login");
  }, [navigate]);

  return {
    user,
    role,
    isAuthenticated: !!user,
    isAdmin: !!user?.is_admin,
    isSupport: !!user?.is_support,
    isManager: !!user?.is_manager,
    canAccessAdmin: checkAdminAccess(role),
    logout,
  };
}
