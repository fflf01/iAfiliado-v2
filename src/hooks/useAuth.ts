/**
 * Hook reativo para estado de autenticacao.
 * Centraliza leitura de token/user e fornece funcao de logout.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, getUser, clearAuth } from "@/lib/auth";
import type { User } from "@/types";

export function useAuth() {
  const [user] = useState<User | null>(() => getUser());
  const [token] = useState<string | null>(() => getToken());
  const navigate = useNavigate();

  const logout = useCallback(() => {
    clearAuth();
    navigate("/login");
  }, [navigate]);

  return {
    user,
    token,
    isAuthenticated: !!token,
    isAdmin: !!user?.is_admin,
    logout,
  };
}
