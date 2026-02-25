import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Crown,
  Users,
  Calendar,
  Building2,
  Wallet,
  LayoutDashboard,
  ClipboardList,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  User,
  Banknote,
  UserX,
  ScrollText,
  UserCog,
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
import type { User as AppUser } from "@/types";
import type {
  AdminUserCasaVinculada,
  AdminUserEntrada,
  AdminUserStats,
  Casino,
  ClientRow,
  ContractRequest,
  ContractRowApi,
  EntradaAdmin,
  Solicitacao,
  UserWallet,
  WithdrawalRowApi,
} from "./types";
import {
  aggregateEntradasByMonth,
  formatCurrencyBRL,
  formatDatePtBr,
  getErrorMessage,
  tipoClienteLabel,
} from "./utils";
import { useAdminBootstrap } from "./hooks/useAdminBootstrap";
import { useAdminUserDashboard } from "./hooks/useAdminUserDashboard";
import { UserDashboardSection } from "./sections/UserDashboardSection";
import { OverviewSection } from "./sections/OverviewSection";
import { SolicitacoesSection } from "./sections/SolicitacoesSection";
import { CasinosSection } from "./sections/CasinosSection";
import { EntradasSection } from "./sections/EntradasSection";
import { CarteirasSection } from "./sections/CarteirasSection";
import { SaquesSection } from "./sections/SaquesSection";
import { UsersSection } from "./sections/UsersSection";
import { ManagerAccountsSection } from "./sections/ManagerAccountsSection";
import { AdminLogsSection } from "./sections/AdminLogsSection";
import { AdminSidebar } from "./ui/AdminSidebar";
import { AdminTopBar } from "./ui/AdminTopBar";

// ── Sidebar nav items ────────────────────────────────────────────────────
const sidebarItems = [
  { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
  { id: "user_dashboard", label: "Dashboard Usuário", icon: Users },
  { id: "solicitacoes", label: "Solicitações", icon: ClipboardList },
  { id: "casinos", label: "Casinos", icon: Building2 },
  { id: "entradas", label: "Entradas", icon: Calendar },
  { id: "carteiras", label: "Carteiras", icon: Wallet },
  { id: "saques", label: "Verificação de saque", icon: Banknote },
  { id: "contas_manager", label: "Contas dos Managers", icon: UserCog },
  { id: "usuarios", label: "Usuários", icon: UserX },
  { id: "log_admin", label: "Log Admin", icon: ScrollText },
];

// ── Component ────────────────────────────────────────────────────────────
const Admin = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    data: bootstrap,
    loading,
    error: bootstrapError,
    refresh,
    updateData,
  } = useAdminBootstrap();

  // Casino state
  const [casinoDialog, setCasinoDialog] = useState(false);
  const [editingCasino, setEditingCasino] = useState<Casino | null>(null);
  const [casinoForm, setCasinoForm] = useState({
    nome: "",
    comissaoCPA: "",
    comissaoRevShare: "",
    urlAfiliado: "",
  });

  // Entradas e carteiras vindas do banco
  const casinos = bootstrap.casinos;
  const entradas = bootstrap.entradas;
  const wallets = bootstrap.wallets;

  // Search
  const [searchEntradas, setSearchEntradas] = useState("");
  const [searchWallets, setSearchWallets] = useState("");
  const [searchCasinos, setSearchCasinos] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Solicitações state
  const solicitacoes = bootstrap.solicitacoes;
  const clients = bootstrap.clients;
  const contractRequests = bootstrap.contractRequests;
  const [searchSolicitacoes, setSearchSolicitacoes] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [detailDialog, setDetailDialog] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] =
    useState<Solicitacao | null>(null);

  const withdrawals = bootstrap.withdrawals;
  const [withdrawalUpdating, setWithdrawalUpdating] = useState<string | null>(
    null,
  );

  // Dashboard por usuario (admin)
  const [dashUserId, setDashUserId] = useState<number | null>(null);
  const [dashUserQuery, setDashUserQuery] = useState("");
  const [dashSelectedHouse, setDashSelectedHouse] = useState("todas");
  const [dashDateRange, setDashDateRange] = useState<"1" | "7" | "30" | "custom">("7");
  const [dashCustomStart, setDashCustomStart] = useState("");
  const [dashCustomEnd, setDashCustomEnd] = useState("");

  const fmt = formatCurrencyBRL;
  useEffect(() => {
    if (!bootstrapError) return;
    toast({
      title: "Erro ao carregar dados",
      description: bootstrapError,
      variant: "destructive",
    });
  }, [bootstrapError, toast]);

  const userDash = useAdminUserDashboard({
    active: activeTab === "user_dashboard",
    userId: dashUserId,
    selectedHouse: dashSelectedHouse,
    dateRange: dashDateRange,
    customStart: dashCustomStart,
    customEnd: dashCustomEnd,
    onResetSelectedHouse: () => setDashSelectedHouse("todas"),
  });

  // ── Casino CRUD ─────────────────────────────────
  const openNewCasino = () => {
    setEditingCasino(null);
    setCasinoForm({
      nome: "",
      comissaoCPA: "",
      comissaoRevShare: "",
      urlAfiliado: "",
    });
    setCasinoDialog(true);
  };

  const openEditCasino = (c: Casino) => {
    setEditingCasino(c);
    setCasinoForm({
      nome: c.nome,
      comissaoCPA: String(c.comissaoCPA),
      comissaoRevShare: String(c.comissaoRevShare),
      urlAfiliado: c.urlAfiliado,
    });
    setCasinoDialog(true);
  };

  const saveCasino = () => {
    if (!casinoForm.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório.",
        variant: "destructive",
      });
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
          const updated = await apiPut<Casino>(
            `/admin/casinos/${editingCasino.id}`,
            payload,
          );
          updateData((prev) => ({
            ...prev,
            casinos: prev.casinos.map((c) => (c.id === updated.id ? updated : c)),
          }));
          toast({
            title: "Casino atualizado!",
            description: `${updated.nome} foi atualizado.`,
          });
        } else {
          const created = await apiPost<Casino>("/admin/casinos", payload);
          updateData((prev) => ({ ...prev, casinos: [created, ...prev.casinos] }));
          toast({
            title: "Casino cadastrado!",
            description: `${created.nome} foi adicionado.`,
          });
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
        updateData((prev) => ({
          ...prev,
          casinos: prev.casinos.map((c) => (c.id === updated.id ? updated : c)),
        }));
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
        updateData((prev) => ({
          ...prev,
          casinos: prev.casinos.filter((c) => c.id !== id),
        }));
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
      refresh();
      toast({
        title: "Solicitação aprovada!",
        description: "O usuário foi aprovado.",
      });
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
      refresh();
      toast({
        title: "Solicitação rejeitada",
        description: "O cadastro foi rejeitado.",
      });
      setDetailDialog(false);
    } catch (err) {
      toast({
        title: "Erro ao rejeitar",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const aprovarContrato = async (id: string, link?: string) => {
    try {
      await apiPut<{ ok: true }>(`/admin/contracts/${id}/status`, {
        status: "aprovado",
        ...(link ? { link } : {}),
      });
      refresh();
      toast({
        title: "Contrato aprovado!",
        description: "O usuário foi vinculado à casa.",
      });
    } catch (err) {
      toast({
        title: "Erro ao aprovar contrato",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const rejeitarContrato = async (id: string) => {
    try {
      await apiPut<{ ok: true }>(`/admin/contracts/${id}/status`, {
        status: "rejeitado",
      });
      refresh();
      toast({
        title: "Contrato rejeitado",
        description: "Solicitação rejeitada.",
      });
    } catch (err) {
      toast({
        title: "Erro ao rejeitar contrato",
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
  const filteredCasinos = casinos.filter((c) =>
    c.nome.toLowerCase().includes(searchCasinos.toLowerCase()),
  );
  const filteredEntradas = entradas.filter((e) => {
    const matchSearch =
      e.usuario.toLowerCase().includes(searchEntradas.toLowerCase()) ||
      e.casa.toLowerCase().includes(searchEntradas.toLowerCase()) ||
      e.email.toLowerCase().includes(searchEntradas.toLowerCase());
    const matchTipo = filtroTipo === "todos" || e.tipo === filtroTipo;
    return matchSearch && matchTipo;
  });
  const filteredWallets = wallets.filter(
    (w) =>
      w.usuario.toLowerCase().includes(searchWallets.toLowerCase()) ||
      w.email.toLowerCase().includes(searchWallets.toLowerCase()),
  );
  const filteredSolicitacoes = solicitacoes.filter((s) => {
    const matchSearch =
      s.nome.toLowerCase().includes(searchSolicitacoes.toLowerCase()) ||
      s.email.toLowerCase().includes(searchSolicitacoes.toLowerCase());
    const matchStatus = filtroStatus === "todos" || s.status === filtroStatus;
    return matchSearch && matchStatus;
  });
  const filteredContractRequests = contractRequests.filter((c) => {
    const q = searchSolicitacoes.toLowerCase();
    const matchSearch =
      !q ||
      c.afiliadoNome.toLowerCase().includes(q) ||
      c.afiliadoEmail.toLowerCase().includes(q) ||
      c.casaNome.toLowerCase().includes(q);
    const matchStatus = filtroStatus === "todos" || c.status === filtroStatus;
    return matchSearch && matchStatus;
  });
  const pendentesCount = solicitacoes.filter(
    (s) => s.status === "pendente",
  ).length;
  const contractPendentesCount = contractRequests.filter(
    (c) => c.status === "pendente",
  ).length;
  const totalPendencias = pendentesCount + contractPendentesCount;

  // ── Global stats ─────────────────────────────────
  const totalDepositos = entradas
    .filter((e) => e.tipo === "deposito")
    .reduce((s, e) => s + e.valor, 0);
  const totalCPA = entradas
    .filter((e) => e.tipo === "cpa")
    .reduce((s, e) => s + e.valor, 0);
  const totalRevShare = entradas
    .filter((e) => e.tipo === "revshare")
    .reduce((s, e) => s + e.valor, 0);
  const totalSaldoUsuarios = wallets.reduce((s, w) => s + w.saldoDisponivel, 0);

  const tipoLabel = (tipo: string) => {
    switch (tipo) {
      case "deposito":
        return "Depósito";
      case "cpa":
        return "CPA";
      case "ftd":
        return "FTD";
      case "revshare":
        return "Rev Share";
      default:
        return tipo;
    }
  };
  const tipoBadge = (tipo: string) => {
    switch (tipo) {
      case "deposito":
        return "bg-primary/15 text-primary";
      case "cpa":
        return "bg-secondary/15 text-secondary";
      case "ftd":
        return "bg-blue-500/15 text-blue-400";
      case "revshare":
        return "bg-purple-500/15 text-purple-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (isMobile) setSidebarOpen(false);
  };

  const filteredDashClients = useMemo(() => {
    const q = dashUserQuery.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      return (
        c.full_name?.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    });
  }, [clients, dashUserQuery]);

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        isMobile={isMobile}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        onSelectTab={handleNavClick}
        items={sidebarItems.map((i) => ({
          ...i,
          badge: i.id === "solicitacoes" ? totalPendencias : undefined,
        }))}
      />

      {/* ── Main Content ─────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <AdminTopBar isMobile={isMobile} onOpenSidebar={() => setSidebarOpen(true)} />

        <main className="p-4 md:p-8">
          {/* ── Overview ──────────────────────────────── */}
          {activeTab === "overview" && (
            <OverviewSection
              casinos={casinos}
              entradas={entradas}
              wallets={wallets}
              withdrawals={withdrawals}
              pendentesCount={pendentesCount}
              contractPendentesCount={contractPendentesCount}
              totalDepositos={totalDepositos}
              totalCPA={totalCPA}
              totalRevShare={totalRevShare}
              totalSaldoUsuarios={totalSaldoUsuarios}
              fmt={fmt}
              onNavigate={(tabId) => setActiveTab(tabId)}
            />
          )}

          {/* ── Solicitações ─────────────────────────── */}
          {activeTab === "solicitacoes" && (
            <SolicitacoesSection
              totalPendencias={totalPendencias}
              pendentesCount={pendentesCount}
              contractPendentesCount={contractPendentesCount}
              search={searchSolicitacoes}
              onSearchChange={setSearchSolicitacoes}
              filtroStatus={filtroStatus}
              onFiltroStatusChange={setFiltroStatus}
              solicitacoes={filteredSolicitacoes}
              contractRequests={filteredContractRequests}
              onOpenDetail={openDetail}
              onApproveSolicitacao={aprovarSolicitacao}
              onRejectSolicitacao={rejeitarSolicitacao}
              onApproveContract={aprovarContrato}
              onRejectContract={rejeitarContrato}
            />
          )}

          {/* ── Dashboard Usuário ─────────────────────────── */}
          {activeTab === "user_dashboard" && (
            <UserDashboardSection
              clients={clients}
              userId={dashUserId}
              userQuery={dashUserQuery}
              onUserQueryChange={setDashUserQuery}
              onUserIdChange={setDashUserId}
              selectedHouse={dashSelectedHouse}
              onSelectedHouseChange={setDashSelectedHouse}
              dateRange={dashDateRange}
              onDateRangeChange={setDashDateRange}
              customStart={dashCustomStart}
              onCustomStartChange={setDashCustomStart}
              customEnd={dashCustomEnd}
              onCustomEndChange={setDashCustomEnd}
              loading={userDash.loading}
              error={userDash.error}
              profile={userDash.profile}
              casas={userDash.casas}
              stats={userDash.stats}
              performanceData={userDash.performanceData}
            />
          )}

          {/* ── Casinos ──────────────────────────────── */}
          {activeTab === "casinos" && (
            <CasinosSection
              casinos={filteredCasinos}
              search={searchCasinos}
              onSearchChange={setSearchCasinos}
              fmt={fmt}
              onOpenNew={openNewCasino}
              onEdit={openEditCasino}
              onToggleStatus={toggleCasinoStatus}
              onDelete={deleteCasino}
            />
          )}

          {/* ── Entradas ─────────────────────────────── */}
          {activeTab === "entradas" && (
            <EntradasSection
              entradas={filteredEntradas}
              search={searchEntradas}
              onSearchChange={setSearchEntradas}
              filtroTipo={filtroTipo}
              onFiltroTipoChange={setFiltroTipo}
              fmt={fmt}
              formatDate={formatDatePtBr}
            />
          )}

          {/* ── Carteiras ────────────────────────────── */}
          {activeTab === "carteiras" && (
            <CarteirasSection
              wallets={filteredWallets}
              search={searchWallets}
              onSearchChange={setSearchWallets}
              fmt={fmt}
            />
          )}

          {/* ── Verificação de saque ────────────────────────────── */}
          {activeTab === "saques" && (
            <SaquesSection
              withdrawals={withdrawals}
              withdrawalUpdating={withdrawalUpdating}
              fmt={fmt}
              onReject={async (id) => {
                setWithdrawalUpdating(id);
                try {
                  await apiPut(`/admin/withdrawals/${id}/status`, { status: "rejeitado" });
                  refresh();
                  toast({
                    title: "Saque rejeitado.",
                    description: "A solicitação foi rejeitada.",
                  });
                } catch (e) {
                  toast({
                    title: "Erro",
                    description: getErrorMessage(e),
                    variant: "destructive",
                  });
                } finally {
                  setWithdrawalUpdating(null);
                }
              }}
              onApprove={async (id) => {
                setWithdrawalUpdating(id);
                try {
                  await apiPut(`/admin/withdrawals/${id}/status`, { status: "aprovado" });
                  refresh();
                  toast({
                    title: "Saque aprovado.",
                    description: "O saldo do usuário foi atualizado.",
                  });
                } catch (e) {
                  toast({
                    title: "Erro",
                    description: getErrorMessage(e),
                    variant: "destructive",
                  });
                } finally {
                  setWithdrawalUpdating(null);
                }
              }}
            />
          )}

          {/* ── Contas dos Managers ────────────────────────────── */}
          {activeTab === "contas_manager" && <ManagerAccountsSection active />}

          {/* ── Usuários (punição) ────────────────────────────── */}
          {activeTab === "usuarios" && <UsersSection active />}

          {/* ── Log Admin (auditoria) ─────────────────────────── */}
          {activeTab === "log_admin" && <AdminLogsSection active />}
        </main>
      </div>

      {/* ── Solicitação Detail Dialog ────────────── */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display">
              Detalhes da Solicitação
            </DialogTitle>
            <DialogDescription>
              Informações do cadastro enviado pelo usuário.
            </DialogDescription>
          </DialogHeader>
          {selectedSolicitacao && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> Nome Completo
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedSolicitacao.nome}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> Login
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    @{selectedSolicitacao.login}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedSolicitacao.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Telefone
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedSolicitacao.telefone}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedSolicitacao.cpfCnpj || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Opção do registro
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {tipoClienteLabel(selectedSolicitacao.tipoCliente)}
                  </p>
                </div>
              </div>
              {selectedSolicitacao.contatoAnalise && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Contato para análise
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedSolicitacao.contatoAnalise}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Data do Cadastro
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {selectedSolicitacao.dataCadastro}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        selectedSolicitacao.status === "pendente"
                          ? "bg-secondary/15 text-secondary"
                          : selectedSolicitacao.status === "aprovado"
                            ? "bg-primary/15 text-primary"
                            : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {selectedSolicitacao.status.charAt(0).toUpperCase() +
                        selectedSolicitacao.status.slice(1)}
                    </span>
                    {selectedSolicitacao.is_manager && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        Manager
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {selectedSolicitacao?.status === "pendente" && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  selectedSolicitacao &&
                  rejeitarSolicitacao(selectedSolicitacao.id)
                }
                className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
              >
                <XCircle className="w-4 h-4" /> Rejeitar
              </Button>
              <Button
                variant="neon"
                onClick={() =>
                  selectedSolicitacao &&
                  aprovarSolicitacao(selectedSolicitacao.id)
                }
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
            <DialogTitle className="font-display">
              {editingCasino ? "Editar Casino" : "Novo Casino"}
            </DialogTitle>
            <DialogDescription>
              {editingCasino
                ? "Atualize as informações do casino."
                : "Cadastre um novo casino afiliado."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                Nome do Casino
              </label>
              <Input
                placeholder="Ex: BrasilBet"
                value={casinoForm.nome}
                onChange={(e) =>
                  setCasinoForm((f) => ({ ...f, nome: e.target.value }))
                }
                className="bg-muted/30 border-border/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Comissão CPA (R$)
                </label>
                <Input
                  type="number"
                  placeholder="150"
                  value={casinoForm.comissaoCPA}
                  onChange={(e) =>
                    setCasinoForm((f) => ({
                      ...f,
                      comissaoCPA: e.target.value,
                    }))
                  }
                  className="bg-muted/30 border-border/50"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Rev Share (%)
                </label>
                <Input
                  type="number"
                  placeholder="30"
                  value={casinoForm.comissaoRevShare}
                  onChange={(e) =>
                    setCasinoForm((f) => ({
                      ...f,
                      comissaoRevShare: e.target.value,
                    }))
                  }
                  className="bg-muted/30 border-border/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                URL do Afiliado
              </label>
              <Input
                placeholder="https://casino.com/aff"
                value={casinoForm.urlAfiliado}
                onChange={(e) =>
                  setCasinoForm((f) => ({ ...f, urlAfiliado: e.target.value }))
                }
                className="bg-muted/30 border-border/50"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="neon" onClick={saveCasino}>
              {editingCasino ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
