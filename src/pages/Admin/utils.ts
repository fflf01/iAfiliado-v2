import type { AdminUserEntrada, ClientRow, ContractRequest, ContractRowApi, Solicitacao } from "./types";

export const MESES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export function aggregateEntradasByMonth(
  entradas: AdminUserEntrada[],
): { name: string; cliques: number; conversoes: number }[] {
  const byMonth: Record<string, { depositos: number; ftd: number }> = {};
  for (const e of entradas) {
    const d = new Date(e.dataHora);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!byMonth[key]) byMonth[key] = { depositos: 0, ftd: 0 };
    byMonth[key].depositos += e.depositos;
    byMonth[key].ftd += e.ftd;
  }

  const sorted = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  return sorted.map(([key]) => {
    const [, m] = key.split("-").map(Number);
    return {
      name: MESES[m] ?? String(m),
      cliques: byMonth[key].depositos,
      conversoes: byMonth[key].ftd,
    };
  });
}

export function buildQuery(
  params: Record<string, string | number | undefined | null>,
): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export function startOfDayMs(d: Date): number {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

export function endOfDayMs(d: Date): number {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy.getTime();
}

export function tipoClienteLabel(tipo?: string | null): string {
  switch (tipo) {
    case "gestor_vip":
      return "VIP Manager";
    case "gestor_afiliados":
      return "Affiliate Manager";
    case "influencer":
      return "Influencer";
    case "vip":
      return "VIP";
    default:
      return tipo ? tipo : "N/A";
  }
}

export function formatDatePtBr(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

export function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const maybe = (err as { message?: unknown }).message;
    if (typeof maybe === "string") return maybe;
  }
  return "Erro inesperado.";
}

export function formatCurrencyBRL(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export function buildSolicitacoesFromClients(clientsData: ClientRow[]): Solicitacao[] {
  return (clientsData || [])
    .filter((u) => !!u.tipo_cliente)
    .map((u) => ({
      id: u.id,
      nome: u.full_name,
      login: u.username,
      email: u.email,
      telefone: u.phone || "N/A",
      cpfCnpj: u.cpf_cnpj,
      tipoCliente: u.tipo_cliente,
      contatoAnalise: u.tipo_cliente === "influencer" ? u.rede_an : u.tele_an,
      dataCadastro: formatDatePtBr(u.created_at),
      status: (() => {
        const st = String(u.cadastro_status ?? "").trim().toLowerCase();
        if (st === "aprovado") return "aprovado";
        if (st === "rejeitado") return "rejeitado";
        return "pendente";
      })(),
      is_manager: !!u.is_manager,
    }));
}

export function buildContractRequestsFromApi(rows: ContractRowApi[]): ContractRequest[] {
  return (rows || []).map((row) => ({
    id: String(row.id),
    casaNome: String(row.casa_nome || ""),
    afiliadoId: Number(row.afiliado_id),
    afiliadoNome: String(row.afiliado_nome || ""),
    afiliadoEmail: String(row.afiliado_email || ""),
    afiliadoPhone: row.afiliado_phone ?? null,
    dataCriacao: formatDatePtBr(String(row.data_criacao || "")),
    status:
      row.status === "aprovado"
        ? "aprovado"
        : row.status === "rejeitado"
          ? "rejeitado"
          : "pendente",
  }));
}
