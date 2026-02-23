import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Crown,
  Plus,
  Search,
  Users,
  DollarSign,
  BarChart2,
  Wallet,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Building2,
  Menu,
  X,
  LayoutDashboard,
  ArrowLeft,
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client";

// ── Types ────────────────────────────────────────────────────────────────
interface Casino {
  id: string;
  nome: string;
  comissaoCPA: number;
  comissaoRevShare: number;
  status: "ativo" | "inativo";
  urlAfiliado: string;
}

interface EntradaAdmin {
  id: string;
  usuario: string;
  email: string;
  casa: string;
  tipo: "deposito" | "cpa" | "ftd" | "revshare";
  valor: number;
  data: string;
}

interface UserWallet {
  id: string;
  usuario: string;
  email: string;
  saldoDisponivel: number;
  saldoPendente: number;
  totalSacado: number;
  ultimaAtividade: string;
}

interface Solicitacao {
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

interface ClientRow {
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

function tipoClienteLabel(tipo?: string | null): string {
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

function formatDatePtBr(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("pt-BR");
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    const maybe = (err as { message?: unknown }).message;
    if (typeof maybe === "string") return maybe;
  }
  return "Erro inesperado.";
}

// ── Sidebar nav items ────────────────────────────────────────────────────
const sidebarItems = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "solicitacoes", label: "Solicitações", icon: ClipboardList },
  { id: "casinos", label: "Casinos", icon: Building2 },
  { id: "entradas", label: "Entradas", icon: Calendar },
  { id: "carteiras", label: "Carteiras", icon: Wallet },
];

// ── Component ────────────────────────────────────────────────────────────
const Admin = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Casino state
  const [casinos, setCasinos] = useState<Casino[]>([]);
  const [casinoDialog, setCasinoDialog] = useState(false);
  const [editingCasino, setEditingCasino] = useState<Casino | null>(null);
  const [casinoForm, setCasinoForm] = useState({ nome: "", comissaoCPA: "", comissaoRevShare: "", urlAfiliado: "" });

  // Entradas e carteiras vindas do banco
  const [entradas, setEntradas] = useState<EntradaAdmin[]>([]);
  const [wallets, setWallets] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);

  // Search
  const [searchEntradas, setSearchEntradas] = useState("");
  const [searchWallets, setSearchWallets] = useState("");
  const [searchCasinos, setSearchCasinos] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Solicitações state
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [searchSolicitacoes, setSearchSolicitacoes] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<Solicitacao | null>(null);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const [casinosData, entradasData, walletsData, clientsData] = await Promise.all([
          apiGet<Casino[]>("/admin/casinos"),
          apiGet<EntradaAdmin[]>("/admin/entradas"),
          apiGet<UserWallet[]>("/admin/wallets"),
          apiGet<ClientRow[]>("/clients"),
        ]);

        if (cancelled) return;
        setCasinos(casinosData);
        setEntradas(entradasData);
        setWallets(walletsData);

        // Solicitações: usuários que marcaram "Quero ser um iAfiliado" (tipo_cliente preenchido)
        const solicitacoesData: Solicitacao[] = (clientsData || [])
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
            status:
              u.cadastro_status === "aprovado"
                ? "aprovado"
                : u.cadastro_status === "rejeitado"
                  ? "rejeitado"
                  : "pendente",
          }));
        setSolicitacoes(solicitacoesData);
      } catch (err) {
        toast({
          title: "Erro ao carregar dados",
          description: getErrorMessage(err) || "Falha ao carregar dados do admin.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  // ── Casino CRUD ─────────────────────────────────
  const openNewCasino = () => {
    setEditingCasino(null);
    setCasinoForm({ nome: "", comissaoCPA: "", comissaoRevShare: "", urlAfiliado: "" });
    setCasinoDialog(true);
  };

  const openEditCasino = (c: Casino) => {
    setEditingCasino(c);
    setCasinoForm({ nome: c.nome, comissaoCPA: String(c.comissaoCPA), comissaoRevShare: String(c.comissaoRevShare), urlAfiliado: c.urlAfiliado });
    setCasinoDialog(true);
  };

  const saveCasino = () => {
    if (!casinoForm.nome.trim()) {
      toast({ title: "Erro", description: "Nome é obrigatório.", variant: "destructive" });
      return;
    }

    const payload = {
      nome: casinoForm.nome,
      comissaoCPA: Number(casinoForm.comissaoCPA) || 0,
      comissaoRevShare: Number(casinoForm.comissaoRevShare) || 0,
      urlAfiliado: casinoForm.urlAfiliado,
    };

    (async () => {
      try {
        if (editingCasino) {
          const updated = await apiPut<Casino>(`/admin/casinos/${editingCasino.id}`, payload);
          setCasinos((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          toast({ title: "Casino atualizado!", description: `${updated.nome} foi atualizado.` });
        } else {
          const created = await apiPost<Casino>("/admin/casinos", payload);
          setCasinos((prev) => [created, ...prev]);
          toast({ title: "Casino cadastrado!", description: `${created.nome} foi adicionado.` });
        }

        setCasinoDialog(false);
      } catch (err) {
        toast({
          title: "Erro ao salvar casino",
          description: getErrorMessage(err) || "Falha ao salvar casino.",
          variant: "destructive",
        });
      }
    })();
  };

  const toggleCasinoStatus = (id: string) => {
    const current = casinos.find((c) => c.id === id);
    if (!current) return;

    (async () => {
      try {
        const updated = await apiPut<Casino>(`/admin/casinos/${id}`, {
          ...current,
          status: current.status === "ativo" ? "inativo" : "ativo",
        });
        setCasinos((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } catch (err) {
        toast({
          title: "Erro ao atualizar status",
          description: getErrorMessage(err) || "Falha ao atualizar status.",
          variant: "destructive",
        });
      }
    })();
  };

  const deleteCasino = (id: string) => {
    (async () => {
      try {
        await apiDelete<{ ok: true }>(`/admin/casinos/${id}`);
        setCasinos((prev) => prev.filter((c) => c.id !== id));
        toast({ title: "Casino removido!" });
      } catch (err) {
        toast({
          title: "Erro ao remover casino",
          description: getErrorMessage(err) || "Falha ao remover casino.",
          variant: "destructive",
        });
      }
    })();
  };

  // ── Solicitações actions ─────────────────────────────────
  const aprovarSolicitacao = async (id: number) => {
    try {
      await apiPut<{ ok: true }>(`/admin/solicitacoes/${id}/status`, {
        status: "aprovado",
      });
      setSolicitacoes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "aprovado" } : s)),
      );
      toast({ title: "Solicitação aprovada!", description: "O usuário foi aprovado." });
      setDetailDialog(false);
    } catch (err) {
      toast({
        title: "Erro ao aprovar",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const rejeitarSolicitacao = async (id: number) => {
    try {
      await apiPut<{ ok: true }>(`/admin/solicitacoes/${id}/status`, {
        status: "rejeitado",
      });
      setSolicitacoes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "rejeitado" } : s)),
      );
      toast({ title: "Solicitação rejeitada", description: "O cadastro foi rejeitado." });
      setDetailDialog(false);
    } catch (err) {
      toast({
        title: "Erro ao rejeitar",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const openDetail = (s: Solicitacao) => {
    setSelectedSolicitacao(s);
    setDetailDialog(true);
  };

  // ── Filtered data ─────────────────────────────────
  const filteredCasinos = casinos.filter(c => c.nome.toLowerCase().includes(searchCasinos.toLowerCase()));
  const filteredEntradas = entradas.filter(e => {
    const matchSearch = e.usuario.toLowerCase().includes(searchEntradas.toLowerCase()) || e.casa.toLowerCase().includes(searchEntradas.toLowerCase()) || e.email.toLowerCase().includes(searchEntradas.toLowerCase());
    const matchTipo = filtroTipo === "todos" || e.tipo === filtroTipo;
    return matchSearch && matchTipo;
  });
  const filteredWallets = wallets.filter(w => w.usuario.toLowerCase().includes(searchWallets.toLowerCase()) || w.email.toLowerCase().includes(searchWallets.toLowerCase()));
  const filteredSolicitacoes = solicitacoes.filter(s => {
    const matchSearch = s.nome.toLowerCase().includes(searchSolicitacoes.toLowerCase()) || s.email.toLowerCase().includes(searchSolicitacoes.toLowerCase());
    const matchStatus = filtroStatus === "todos" || s.status === filtroStatus;
    return matchSearch && matchStatus;
  });
  const pendentesCount = solicitacoes.filter(s => s.status === "pendente").length;

  // ── Global stats ─────────────────────────────────
  const totalDepositos = entradas.filter(e => e.tipo === "deposito").reduce((s, e) => s + e.valor, 0);
  const totalCPA = entradas.filter(e => e.tipo === "cpa").reduce((s, e) => s + e.valor, 0);
  const totalRevShare = entradas.filter(e => e.tipo === "revshare").reduce((s, e) => s + e.valor, 0);
  const totalSaldoUsuarios = wallets.reduce((s, w) => s + w.saldoDisponivel, 0);

  const tipoLabel = (tipo: string) => {
    switch (tipo) { case "deposito": return "Depósito"; case "cpa": return "CPA"; case "ftd": return "FTD"; case "revshare": return "Rev Share"; default: return tipo; }
  };
  const tipoBadge = (tipo: string) => {
    switch (tipo) { case "deposito": return "bg-primary/15 text-primary"; case "cpa": return "bg-secondary/15 text-secondary"; case "ftd": return "bg-blue-500/15 text-blue-400"; case "revshare": return "bg-purple-500/15 text-purple-400"; default: return "bg-muted text-muted-foreground"; }
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Sidebar ──────────────────────────────────── */}
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full z-50 bg-card border-r border-border/50 flex flex-col transition-transform duration-300
          w-64
          ${isMobile ? (sidebarOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
          lg:sticky lg:top-0
        `}
      >
        {/* Sidebar header */}
        <div className="p-5 border-b border-border/50 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3">
            <img src="/iAfiliado.png" alt="iAfiliado" className="h-8 w-auto" />
          </Link>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Ações rápidas */}
        <div className="px-5 py-3 border-b border-border/50 space-y-2">
          <span className="inline-flex text-xs font-semibold uppercase px-3 py-1 rounded-full bg-destructive/20 text-destructive border border-destructive/30">
            Painel Admin
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === "solicitacoes" && pendentesCount > 0 && (
                <span className="ml-auto text-xs font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                  {pendentesCount}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ─────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* Botao fixo no desktop (canto superior direito) */}
        <div className="fixed top-4 right-4 z-40 hidden lg:block">
          <Link to="/dashboard" className="text-foreground">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border/50 px-4 py-3 flex items-center justify-between lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <img src="/iAfiliado.png" alt="iAfiliado" className="h-7 w-auto" />
          <Link to="/dashboard" className="text-foreground">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
        </header>

        <main className="p-4 md:p-8">
          {/* ── Overview ──────────────────────────────── */}
          {activeTab === "overview" && (
            <>
              <div className="mb-6">
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-1">
                  <span className="text-foreground">Painel </span>
                  <span className="text-gradient-neon">Administrativo</span>
                </h1>
                <p className="text-muted-foreground">Visão geral da plataforma</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-card/80 border-border/50 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10"><DollarSign className="w-5 h-5 text-primary" /></div>
                    <span className="text-sm text-muted-foreground">Total Depósitos</span>
                  </div>
                  <p className="text-2xl font-bold font-display text-foreground">{fmt(totalDepositos)}</p>
                </Card>
                <Card className="bg-card/80 border-border/50 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-secondary/10"><BarChart2 className="w-5 h-5 text-secondary" /></div>
                    <span className="text-sm text-muted-foreground">Total CPA</span>
                  </div>
                  <p className="text-2xl font-bold font-display text-foreground">{fmt(totalCPA)}</p>
                </Card>
                <Card className="bg-card/80 border-border/50 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/10"><TrendingUp className="w-5 h-5 text-purple-400" /></div>
                    <span className="text-sm text-muted-foreground">Total Rev Share</span>
                  </div>
                  <p className="text-2xl font-bold font-display text-foreground">{fmt(totalRevShare)}</p>
                </Card>
                <Card className="bg-card/80 border-border/50 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10"><Wallet className="w-5 h-5 text-primary" /></div>
                    <span className="text-sm text-muted-foreground">Saldo Usuários</span>
                  </div>
                  <p className="text-2xl font-bold font-display text-foreground">{fmt(totalSaldoUsuarios)}</p>
                </Card>
              </div>

              {/* Quick access cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: "solicitacoes", icon: ClipboardList, title: "Solicitações", desc: `${pendentesCount} pendentes`, color: "text-secondary" },
                  { id: "casinos", icon: Building2, title: "Casinos", desc: `${casinos.length} casinos cadastrados`, color: "text-primary" },
                  { id: "entradas", icon: Calendar, title: "Entradas", desc: `${entradas.length} registros`, color: "text-secondary" },
                  { id: "carteiras", icon: Wallet, title: "Carteiras", desc: `${wallets.length} usuários`, color: "text-primary" },
                ].map(card => (
                  <Card
                    key={card.id}
                    className="bg-card/80 border-border/50 p-6 cursor-pointer hover:border-primary/30 transition-all"
                    onClick={() => setActiveTab(card.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted/30">
                        <card.icon className={`w-6 h-6 ${card.color}`} />
                      </div>
                      <div>
                        <p className="font-bold text-foreground font-display">{card.title}</p>
                        <p className="text-sm text-muted-foreground">{card.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* ── Solicitações ─────────────────────────── */}
          {activeTab === "solicitacoes" && (
            <Card className="bg-card/80 border-border/50 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Solicitações de Cadastro</h2>
                  <p className="text-sm text-muted-foreground">{pendentesCount} pendente{pendentesCount !== 1 ? "s" : ""} de análise</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar por nome ou email..." value={searchSolicitacoes} onChange={e => setSearchSolicitacoes(e.target.value)} className="pl-10 bg-muted/30 border-border/50" />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {["todos", "pendente", "aprovado", "rejeitado"].map(st => (
                  <Button key={st} size="sm" variant={filtroStatus === st ? "default" : "outline"} onClick={() => setFiltroStatus(st)} className={filtroStatus === st ? "bg-primary text-primary-foreground" : ""}>
                    {st === "todos" ? "Todos" : st.charAt(0).toUpperCase() + st.slice(1) + "s"}
                  </Button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredSolicitacoes.map(sol => (
                  <div key={sol.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        sol.status === "pendente" ? "bg-secondary/10" : sol.status === "aprovado" ? "bg-primary/10" : "bg-destructive/10"
                      }`}>
                        {sol.status === "pendente" ? <Clock className="w-5 h-5 text-secondary" /> : sol.status === "aprovado" ? <CheckCircle className="w-5 h-5 text-primary" /> : <XCircle className="w-5 h-5 text-destructive" />}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{sol.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {sol.email} • {sol.telefone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Opção:{" "}
                          <span className="text-foreground font-medium">
                            {tipoClienteLabel(sol.tipoCliente)}
                          </span>
                          {sol.contatoAnalise ? ` • Contato: ${sol.contatoAnalise}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Login</p>
                        <p className="text-sm font-medium text-foreground">@{sol.login}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Data</p>
                        <p className="text-sm text-muted-foreground">{sol.dataCadastro}</p>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        sol.status === "pendente" ? "bg-secondary/15 text-secondary" : sol.status === "aprovado" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                      }`}>
                        {sol.status.charAt(0).toUpperCase() + sol.status.slice(1)}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDetail(sol)} title="Ver detalhes">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {sol.status === "pendente" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => aprovarSolicitacao(sol.id)}
                              className="text-primary hover:text-primary"
                              title="Aprovar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => rejeitarSolicitacao(sol.id)}
                              className="text-destructive hover:text-destructive"
                              title="Rejeitar"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredSolicitacoes.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhuma solicitação encontrada.</p>}
              </div>
            </Card>
          )}

          {/* ── Casinos ──────────────────────────────── */}
          {activeTab === "casinos" && (
            <Card className="bg-card/80 border-border/50 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground">Casinos Afiliados</h2>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Buscar casino..." value={searchCasinos} onChange={e => setSearchCasinos(e.target.value)} className="pl-10 bg-muted/30 border-border/50" />
                  </div>
                  <Button variant="neon" size="sm" className="gap-2" onClick={openNewCasino}>
                    <Plus className="w-4 h-4" /> Novo
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {filteredCasinos.map(casino => (
                  <div key={casino.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                      <div>
                        <p className="font-bold text-foreground">{casino.nome}</p>
                        <p className="text-xs text-muted-foreground">{casino.urlAfiliado}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <div className="text-center"><p className="text-xs text-muted-foreground">CPA</p><p className="text-sm font-semibold text-foreground">{fmt(casino.comissaoCPA)}</p></div>
                      <div className="text-center"><p className="text-xs text-muted-foreground">Rev Share</p><p className="text-sm font-semibold text-foreground">{casino.comissaoRevShare}%</p></div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${casino.status === "ativo" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                        {casino.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditCasino(casino)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleCasinoStatus(casino.id)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCasino(casino.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredCasinos.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum casino encontrado.</p>}
              </div>
            </Card>
          )}

          {/* ── Entradas ─────────────────────────────── */}
          {activeTab === "entradas" && (
            <Card className="bg-card/80 border-border/50 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground">Auditoria de Entradas</h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar por usuário ou casa..." value={searchEntradas} onChange={e => setSearchEntradas(e.target.value)} className="pl-10 bg-muted/30 border-border/50" />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                {["todos", "deposito", "cpa", "ftd", "revshare"].map(tipo => (
                  <Button key={tipo} size="sm" variant={filtroTipo === tipo ? "default" : "outline"} onClick={() => setFiltroTipo(tipo)} className={filtroTipo === tipo ? "bg-primary text-primary-foreground" : ""}>
                    {tipo === "todos" ? "Todos" : tipoLabel(tipo)}
                  </Button>
                ))}
              </div>
              <div className="overflow-x-auto">
              <div className="grid grid-cols-6 gap-2 px-4 py-3 bg-muted/20 rounded-t-lg text-xs font-medium text-muted-foreground min-w-[700px]">
                  <span>Usuário</span><span>Casa</span><span>Tipo</span><span className="text-right">Valor</span><span className="text-right">Data</span><span className="text-right">Email</span>
                </div>
                <div className="space-y-1 min-w-[700px]">
                  {filteredEntradas.map(entrada => (
                    <div key={entrada.id} className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-border/30 hover:bg-muted/10 transition-colors items-center">
                      <span className="text-sm font-medium text-foreground">{entrada.usuario}</span>
                      <span className="text-sm text-foreground">{entrada.casa}</span>
                      <span><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoBadge(entrada.tipo)}`}>{tipoLabel(entrada.tipo)}</span></span>
                      <span className="text-sm text-right font-semibold text-foreground">{["ftd", "cpa"].includes(entrada.tipo) ? entrada.valor : fmt(entrada.valor)}</span>
                      <span className="text-sm text-right text-muted-foreground">{formatDatePtBr(entrada.data)}</span>
                      <span className="text-sm text-right text-muted-foreground truncate">{entrada.email}</span>
                    </div>
                  ))}
                  {filteredEntradas.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhuma entrada encontrada.</p>}
                </div>
              </div>
            </Card>
          )}

          {/* ── Carteiras ────────────────────────────── */}
          {activeTab === "carteiras" && (
            <Card className="bg-card/80 border-border/50 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-display font-bold text-foreground">Carteiras dos Usuários</h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar usuário..." value={searchWallets} onChange={e => setSearchWallets(e.target.value)} className="pl-10 bg-muted/30 border-border/50" />
                </div>
              </div>
              <div className="space-y-3">
                {filteredWallets.map(wallet => (
                  <div key={wallet.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
                      <div><p className="font-bold text-foreground">{wallet.usuario}</p><p className="text-xs text-muted-foreground">{wallet.email}</p></div>
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="text-center"><p className="text-xs text-muted-foreground">Disponível</p><p className="text-sm font-bold text-primary">{fmt(wallet.saldoDisponivel)}</p></div>
                      <div className="text-center"><p className="text-xs text-muted-foreground">Pendente</p><p className="text-sm font-semibold text-secondary">{fmt(wallet.saldoPendente)}</p></div>
                      <div className="text-center"><p className="text-xs text-muted-foreground">Total Sacado</p><p className="text-sm font-semibold text-foreground">{fmt(wallet.totalSacado)}</p></div>
                      <div className="text-center"><p className="text-xs text-muted-foreground">Última Atividade</p><p className="text-sm text-muted-foreground">{wallet.ultimaAtividade}</p></div>
                    </div>
                  </div>
                ))}
                {filteredWallets.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</p>}
              </div>
            </Card>
          )}
        </main>
      </div>

      {/* ── Solicitação Detail Dialog ────────────── */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display">Detalhes da Solicitação</DialogTitle>
            <DialogDescription>Informações do cadastro enviado pelo usuário.</DialogDescription>
          </DialogHeader>
          {selectedSolicitacao && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Nome Completo</p>
                  <p className="text-sm font-medium text-foreground">{selectedSolicitacao.nome}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> Login</p>
                  <p className="text-sm font-medium text-foreground">@{selectedSolicitacao.login}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                  <p className="text-sm font-medium text-foreground">{selectedSolicitacao.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</p>
                  <p className="text-sm font-medium text-foreground">{selectedSolicitacao.telefone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                  <p className="text-sm font-medium text-foreground">{selectedSolicitacao.cpfCnpj || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Opção do registro</p>
                  <p className="text-sm font-medium text-foreground">{tipoClienteLabel(selectedSolicitacao.tipoCliente)}</p>
                </div>
              </div>
              {selectedSolicitacao.contatoAnalise && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Contato para análise</p>
                  <p className="text-sm font-medium text-foreground">{selectedSolicitacao.contatoAnalise}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Data do Cadastro</p>
                  <p className="text-sm font-medium text-foreground">{selectedSolicitacao.dataCadastro}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    selectedSolicitacao.status === "pendente" ? "bg-secondary/15 text-secondary" : selectedSolicitacao.status === "aprovado" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
                  }`}>
                    {selectedSolicitacao.status.charAt(0).toUpperCase() + selectedSolicitacao.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          )}
          {selectedSolicitacao?.status === "pendente" && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => selectedSolicitacao && rejeitarSolicitacao(selectedSolicitacao.id)}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
              >
                <XCircle className="w-4 h-4" /> Rejeitar
              </Button>
              <Button
                variant="neon"
                onClick={() => selectedSolicitacao && aprovarSolicitacao(selectedSolicitacao.id)}
                className="gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Aprovar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Casino Dialog ────────────────────────────── */}
      <Dialog open={casinoDialog} onOpenChange={setCasinoDialog}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display">{editingCasino ? "Editar Casino" : "Novo Casino"}</DialogTitle>
            <DialogDescription>{editingCasino ? "Atualize as informações do casino." : "Cadastre um novo casino afiliado."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Nome do Casino</label>
              <Input placeholder="Ex: BrasilBet" value={casinoForm.nome} onChange={e => setCasinoForm(f => ({ ...f, nome: e.target.value }))} className="bg-muted/30 border-border/50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Comissão CPA (R$)</label>
                <Input type="number" placeholder="150" value={casinoForm.comissaoCPA} onChange={e => setCasinoForm(f => ({ ...f, comissaoCPA: e.target.value }))} className="bg-muted/30 border-border/50" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Rev Share (%)</label>
                <Input type="number" placeholder="30" value={casinoForm.comissaoRevShare} onChange={e => setCasinoForm(f => ({ ...f, comissaoRevShare: e.target.value }))} className="bg-muted/30 border-border/50" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">URL do Afiliado</label>
              <Input placeholder="https://casino.com/aff" value={casinoForm.urlAfiliado} onChange={e => setCasinoForm(f => ({ ...f, urlAfiliado: e.target.value }))} className="bg-muted/30 border-border/50" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button variant="neon" onClick={saveCasino}>{editingCasino ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;