import type { User as AppUser } from "@/types";

export interface Casino {
  id: string;
  nome: string;
  comissaoCPA: number;
  comissaoRevShare: number;
  status: "ativo" | "inativo";
  urlAfiliado: string;
}

export interface EntradaAdmin {
  id: string;
  usuario: string;
  email: string;
  casa: string;
  tipo: "deposito" | "cpa" | "ftd" | "revshare";
  valor: number;
  data: string;
}

export interface UserWallet {
  id: string;
  usuario: string;
  email: string;
  saldoDisponivel: number;
  saldoPendente: number;
  totalSacado: number;
  ultimaAtividade: string;
}

export interface ContractRequest {
  id: string;
  casaNome: string;
  afiliadoId: number;
  afiliadoNome: string;
  afiliadoEmail: string;
  afiliadoPhone: string | null;
  dataCriacao: string;
  status: "pendente" | "aprovado" | "rejeitado";
}

export interface Solicitacao {
  id: number;
  nome: string;
  login: string;
  email: string;
  telefone: string;
  cpfCnpj?: string | null;
  tipoCliente?: string | null;
  contatoAnalise?: string | null;
  dataCadastro: string;
  status: "pendente" | "aprovado" | "rejeitado";
}

export interface ClientRow {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string | null;
  cpf_cnpj: string | null;
  tipo_cliente: string | null;
  tele_an: string | null;
  rede_an: string | null;
  cadastro_status: string | null;
  created_at: string;
}

export interface ContractRowApi {
  id: string;
  status: "pendente" | "aprovado" | "rejeitado";
  data_criacao: string;
  afiliado_id: number;
  afiliado_nome: string;
  afiliado_email: string;
  afiliado_phone: string | null;
  casa_nome: string;
}

export interface WithdrawalRowApi {
  id: string;
  user_id: number;
  user_name: string;
  user_email: string;
  valor: number;
  metodo: string;
  status: "pendente" | "aprovado" | "rejeitado";
  created_at: string;
  updated_at: string;
}

export interface AdminUserStats {
  totalCliques: number;
  totalDepositos: number;
  comissaoTotal: number;
  totalFtds: number;
}

export interface AdminUserEntrada {
  id: string;
  casinoId: string;
  dataHora: number;
  depositos: number;
  cliques: number;
  registros: number;
  ftd: number;
  valorRecebido: number;
  casinoName: string;
}

export interface AdminUserCasaVinculada {
  casinoId: string;
  casinoName: string;
  status: string;
  link: string | null;
}

export type AdminProfileUser = AppUser | null;
