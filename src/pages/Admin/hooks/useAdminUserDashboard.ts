import { useEffect, useMemo, useState } from "react";
import type { User as AppUser } from "@/types";
import { apiGet } from "@/lib/api-client";
import type { AdminUserCasaVinculada, AdminUserEntrada, AdminUserStats } from "../types";
import {
  aggregateEntradasByMonth,
  buildQuery,
  endOfDayMs,
  getErrorMessage,
  startOfDayMs,
} from "../utils";

type DateRange = "1" | "7" | "30" | "custom";

export function useAdminUserDashboard(params: {
  active: boolean;
  userId: number | null;
  selectedHouse: string;
  onResetSelectedHouse?: () => void;
  dateRange: DateRange;
  customStart: string;
  customEnd: string;
}) {
  const { active, userId, selectedHouse, dateRange, customStart, customEnd } = params;

  const [profile, setProfile] = useState<AppUser | null>(null);
  const [casas, setCasas] = useState<AdminUserCasaVinculada[]>([]);
  const [stats, setStats] = useState<AdminUserStats>({
    totalCliques: 0,
    totalDepositos: 0,
    comissaoTotal: 0,
    totalFtds: 0,
  });
  const [entradas, setEntradas] = useState<AdminUserEntrada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Casa efetiva: evita refetch quando a casa não está na lista (sem resetar estado no parent)
  const effectiveHouse =
    selectedHouse === "todas" || casas.some((c) => c.casinoId === selectedHouse)
      ? selectedHouse
      : "todas";
  const casinoId = effectiveHouse !== "todas" ? effectiveHouse : undefined;

  useEffect(() => {
    if (!active) return;
    if (!userId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      apiGet<{ message: string; user: AppUser }>(`/admin/users/${userId}/profile`),
      apiGet<AdminUserCasaVinculada[]>(`/admin/users/${userId}/casas`),
    ])
      .then(([profileData, casasData]) => {
        if (cancelled) return;
        setProfile(profileData?.user || null);
        setCasas(Array.isArray(casasData) ? casasData : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setProfile(null);
        setCasas([]);
        setError(getErrorMessage(err) || "Falha ao carregar usuário.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, userId]);

  useEffect(() => {
    if (!active) return;
    if (!userId) return;

    let cancelled = false;
    setError(null);

    apiGet<AdminUserStats>(
      `/admin/users/${userId}/stats${buildQuery({ casinoId })}`,
    )
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err) || "Falha ao carregar estatísticas.");
      });

    return () => {
      cancelled = true;
    };
  }, [active, userId, casinoId]);

  useEffect(() => {
    if (!active) return;
    if (!userId) return;

    let cancelled = false;

    const today = new Date();
    let fromMs: number | undefined;
    let toMs: number | undefined;

    if (dateRange === "1") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      fromMs = startOfDayMs(y);
      toMs = endOfDayMs(y);
    } else if (dateRange === "7" || dateRange === "30") {
      const days = Number(dateRange);
      const start = new Date(today);
      start.setDate(start.getDate() - (days - 1));
      fromMs = startOfDayMs(start);
      toMs = endOfDayMs(today);
    } else if (dateRange === "custom") {
      if (customStart) fromMs = startOfDayMs(new Date(`${customStart}T00:00:00`));
      if (customEnd) toMs = endOfDayMs(new Date(`${customEnd}T00:00:00`));
    }

    apiGet<AdminUserEntrada[]>(
      `/admin/users/${userId}/entradas${buildQuery({ casinoId, fromMs, toMs })}`,
    )
      .then((data) => {
        if (!cancelled) setEntradas(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setEntradas([]);
      });

    return () => {
      cancelled = true;
    };
  }, [active, userId, casinoId, dateRange, customStart, customEnd]);

  const performanceData = useMemo(() => aggregateEntradasByMonth(entradas), [entradas]);

  return { profile, casas, stats, entradas, performanceData, loading, error };
}

