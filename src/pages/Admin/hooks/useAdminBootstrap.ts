import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api-client";
import type {
  Casino,
  ClientRow,
  ContractRequest,
  ContractRowApi,
  EntradaAdmin,
  Solicitacao,
  UserWallet,
  WithdrawalRowApi,
} from "../types";
import {
  buildContractRequestsFromApi,
  buildSolicitacoesFromClients,
  getErrorMessage,
} from "../utils";

type AdminBootstrapData = {
  casinos: Casino[];
  entradas: EntradaAdmin[];
  wallets: UserWallet[];
  clients: ClientRow[];
  solicitacoes: Solicitacao[];
  contractRequests: ContractRequest[];
  withdrawals: WithdrawalRowApi[];
};

const emptyData: AdminBootstrapData = {
  casinos: [],
  entradas: [],
  wallets: [],
  clients: [],
  solicitacoes: [],
  contractRequests: [],
  withdrawals: [],
};

export function useAdminBootstrap() {
  const [data, setData] = useState<AdminBootstrapData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateData = useCallback(
    (updater: (prev: AdminBootstrapData) => AdminBootstrapData) => {
      setData((prev) => updater(prev));
    },
    [],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        casinosData,
        entradasData,
        walletsData,
        clientsData,
        contractsData,
        withdrawalsData,
      ] = await Promise.all([
        apiGet<Casino[]>("/admin/casinos"),
        apiGet<EntradaAdmin[]>("/admin/entradas"),
        apiGet<UserWallet[]>("/admin/wallets"),
        apiGet<ClientRow[]>("/clients"),
        apiGet<ContractRowApi[]>("/admin/contracts"),
        apiGet<WithdrawalRowApi[]>("/admin/withdrawals"),
      ]);

      const safeClients = Array.isArray(clientsData) ? clientsData : [];
      const safeContracts = Array.isArray(contractsData) ? contractsData : [];
      const safeWithdrawals = Array.isArray(withdrawalsData) ? withdrawalsData : [];

      setData({
        casinos: casinosData || [],
        entradas: entradasData || [],
        wallets: walletsData || [],
        clients: safeClients,
        solicitacoes: buildSolicitacoesFromClients(safeClients),
        contractRequests: buildContractRequestsFromApi(safeContracts),
        withdrawals: safeWithdrawals,
      });
    } catch (err) {
      setError(getErrorMessage(err) || "Falha ao carregar dados do admin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  return { data, loading, error, refresh, updateData };
}

