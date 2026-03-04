import { useState, useMemo, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";
import {
  Crown,
  TrendingUp,
  Users,
  DollarSign,
  MousePointer,
  Banknote,
  LogOut,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Link as LinkIcon,
  Wallet,
  HelpCircle,
  Rocket,
  CalendarDays,
  UserCog,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { apiGet } from "@/lib/api-client";
import { canSeeDashboardSection, canAccessAdmin } from "@/lib/permissions";
import type { User as AppUser } from "@/types";
import PlataformasD from "./Plataformas_D";
import LinkPage from "./LinkPage";
import CarteiraPage from "./Carteira";
import EntradasPage from "./Entradas";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

interface MeEntrada {
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

interface MeCasaVinculada {
  casinoId: string;
  casinoName: string;
  status: string;
  link: string | null;
}

function aggregateEntradasByMonth(entradas: MeEntrada[]): { name: string; cliques: number; conversoes: number }[] {
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
    const [y, m] = key.split("-").map(Number);
    return {
      name: MESES[m],
      cliques: byMonth[key].depositos,
      conversoes: byMonth[key].ftd,
    };
  });
}

// Mock payment history
const paymentHistory = [
  { id: 1, data: "15/01/2024", valor: 1250.0, status: "pago", metodo: "PIX" },
  { id: 2, data: "15/12/2023", valor: 980.5, status: "pago", metodo: "PIX" },
  {
    id: 3,
    data: "15/11/2023",
    valor: 1450.0,
    status: "pago",
    metodo: "Transferência",
  },
  { id: 4, data: "15/10/2023", valor: 720.0, status: "pago", metodo: "PIX" },
  {
    id: 5,
    data: "15/02/2024",
    valor: 1680.0,
    status: "pendente",
    metodo: "PIX",
  },
];

const affiliateLinks = [
  {
    id: "main",
    name: "Link Principal",
    url: "https://casino.com/ref/usuario123",
  },
  {
    id: "promo",
    name: "Promoção Especial",
    url: "https://casino.com/promo/usuario123",
  },
  {
    id: "bonus",
    name: "Bônus Exclusivo",
    url: "https://casino.com/bonus/usuario123",
  },
];

interface MeStats {
  totalCliques: number;
  totalDepositos: number;
  comissaoTotal: number;
  totalFtds: number;
}

const statTemplates = [
  { title: "Total de Cliques", key: "totalCliques" as const, change: 0, isPositive: true, icon: MousePointer, color: "primary" as const, format: "number" as const },
  { title: "Depósito", key: "totalDepositos" as const, change: 0, isPositive: true, icon: Banknote, color: "secondary" as const, format: "number" as const },
  { title: "Comissão Total", key: "comissaoTotal" as const, change: 0, isPositive: true, icon: DollarSign, color: "primary" as const, format: "currency" as const },
  { title: "FTDs", key: "totalFtds" as const, change: 0, isPositive: true, icon: Users, color: "secondary" as const, format: "number" as const },
];


const defaultStats: MeStats = {
  totalCliques: 0,
  totalDepositos: 0,
  comissaoTotal: 0,
  totalFtds: 0,
};

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

function startOfDayMs(d: Date): number {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

function endOfDayMs(d: Date): number {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy.getTime();
}

interface ManagedAccountItem {
  id: number;
  username: string;
  full_name: string;
  email: string;
  created_at: string;
}

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isManager, role } = useAuth();
  const [profileUser, setProfileUser] = useState<AppUser | null>(null);
  const [meStats, setMeStats] = useState<MeStats>(defaultStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [meEntradas, setMeEntradas] = useState<MeEntrada[]>([]);
  const [casasVinculadas, setCasasVinculadas] = useState<MeCasaVinculada[]>([]);
  const [casasLoading, setCasasLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7");
  const [selectedHouse, setSelectedHouse] = useState("todas");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [casasLoaded, setCasasLoaded] = useState(false);
  const [managedAccounts, setManagedAccounts] = useState<ManagedAccountItem[]>([]);
  const [managedAccountsLoading, setManagedAccountsLoading] = useState(false);

  const isEmAnalise = profileUser?.cadastro_status === "em_analise";

  // Casa efetiva: evita refetch quando a casa selecionada não está na lista (derivação em vez de reset em effect)
  const effectiveHouse =
    selectedHouse === "todas" || casasVinculadas.some((c) => c.casinoId === selectedHouse)
      ? selectedHouse
      : "todas";

  // 1) Profile e casas em paralelo (carga inicial)
  useEffect(() => {
    let cancelled = false;
    apiGet<{ message: string; user: AppUser }>("/profile")
      .then((data) => {
        if (!cancelled) setProfileUser(data?.user || null);
      })
      .catch(() => {
        if (!cancelled) setProfileUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCasasLoading(true);
    apiGet<MeCasaVinculada[]>("/me/casas")
      .then((data) => {
        if (!cancelled) {
          setCasasVinculadas(Array.isArray(data) ? data : []);
          setCasasLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCasasVinculadas([]);
          setCasasLoaded(true);
        }
      })
      .finally(() => {
        if (!cancelled) setCasasLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Stats e entradas só após casas carregadas (reduz requisições simultâneas e evita refetch desnecessário)
  useEffect(() => {
    if (!casasLoaded) return;
    let cancelled = false;
    setStatsError(null);
    setStatsLoading(true);
    const casinoId = effectiveHouse !== "todas" ? effectiveHouse : undefined;
    apiGet<MeStats>(`/me/stats${buildQuery({ casinoId })}`)
      .then((data) => {
        if (!cancelled) setMeStats(data);
      })
      .catch(() => {
        if (!cancelled) setStatsError("Não foi possível carregar as estatísticas.");
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [casasLoaded, effectiveHouse]);

  useEffect(() => {
    if (!casasLoaded) return;
    let cancelled = false;
    const casinoId = effectiveHouse !== "todas" ? effectiveHouse : undefined;
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
      if (customStartDate) fromMs = startOfDayMs(new Date(`${customStartDate}T00:00:00`));
      if (customEndDate) toMs = endOfDayMs(new Date(`${customEndDate}T00:00:00`));
    }

    apiGet<MeEntrada[]>(
      `/me/entradas${buildQuery({ casinoId, fromMs, toMs })}`,
    )
      .then((data) => {
        if (!cancelled) setMeEntradas(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setMeEntradas([]);
      });
    return () => {
      cancelled = true;
    };
  }, [casasLoaded, effectiveHouse, dateRange, customStartDate, customEndDate]);

  // Só manager pode acessar a aba "Contas que administro" — redireciona quem não for
  const isContasManagerPath = location.pathname.includes("/contas-manager");
  useEffect(() => {
    if (isContasManagerPath && user !== undefined && user !== null && !isManager) {
      navigate("/dashboard", { replace: true });
    }
  }, [isContasManagerPath, user, isManager, navigate]);

  const activeView = isContasManagerPath
    ? "contas_manager"
    : location.pathname.includes("/plataformas")
      ? "plataformas"
      : location.pathname.includes("/entradas")
        ? "entradas"
        : location.pathname.includes("/links")
          ? "links"
          : location.pathname.includes("/carteira")
            ? "carteira"
            : "dashboard";

  // Contas que o manager administra (só quando é manager e está na aba)
  useEffect(() => {
    if (!isManager || activeView !== "contas_manager") return;
    let cancelled = false;
    setManagedAccountsLoading(true);
    apiGet<ManagedAccountItem[]>("/me/managed-accounts")
      .then((data) => {
        if (!cancelled) setManagedAccounts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setManagedAccounts([]);
      })
      .finally(() => {
        if (!cancelled) setManagedAccountsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isManager, activeView]);

  const allSidebarItems = [
    { icon: LinkIcon, label: "DashBoard", id: "dashboard", path: "/dashboard" },
    { icon: CalendarDays, label: "Entradas", id: "entradas", path: "/entradas" },
    { icon: Wallet, label: "Casas Parceiras", id: "plataformas", path: "/dashboard/plataformas" },
    { icon: Crown, label: "Meus Links", id: "links", path: "/dashboard/links" },
    { icon: Rocket, label: "Carteira", id: "carteira", path: "/dashboard/carteira" },
    { icon: UserCog, label: "Contas que administro", id: "contas_manager", path: "/dashboard/contas-manager" },
    { icon: HelpCircle, label: "Fale com Suporte", id: "suporte", path: canAccessAdmin(role) ? "/suporteadmin" : "/suporte-cliente" },
  ];

  const sidebarItems = allSidebarItems.filter((item) =>
    canSeeDashboardSection(item.id, role),
  );

  const baseStats = useMemo(() => {
    return statTemplates.map((t) => ({
      ...t,
      value: meStats[t.key],
    }));
  }, [meStats]);

  const filteredStats = useMemo(() => {
    return baseStats.map((stat) => {
      const formattedValue =
        stat.format === "currency"
          ? `R$ ${stat.value.toLocaleString("pt-BR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`
          : Math.round(stat.value).toLocaleString("pt-BR");

      return {
        ...stat,
        value: formattedValue,
      };
    });
  }, [baseStats]);

  const performanceData = useMemo(
    () => aggregateEntradasByMonth(meEntradas),
    [meEntradas]
  );

  const filteredPerformanceData = useMemo(() => performanceData, [performanceData]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display font-bold texto-gradiente-secundario">
              <img src="/iAfiliado.png" alt="iAfiliado" className="h-24 md:h-40" />
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Olá,{" "}
              <span className="text-foreground font-medium">
                {profileUser?.full_name || user?.username || "Afiliado"}
              </span>
            </span>
            {canAccessAdmin(role) && (
              <Link to="/admin">
                <Button className="gap-2 btn-principal" size="sm">
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={logout}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 mt-6 lg:mt-2">
          <Card className="bg-card/50 border-border/50 p-4">
            <nav className="flex flex-col gap-2">
              {sidebarItems.map((item, index) => {
                const isActive = item.id === activeView;
                const className = `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/10"
                }`;

                return (
                  <Link key={index} to={item.path || "#"} className={className}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </Card>
        </aside>

        <main className="flex-1 min-w-0">
          {activeView === "dashboard" ? (
            <>
              {/* Page Title */}
              <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
                    <span className="text-foreground">Painel do </span>
                    <span className="texto-gradiente-destaque">Afiliado</span>
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe suas estatísticas e gerencie seus links de afiliado
                  </p>
                  {profileUser?.cadastro_status === "em_analise" && (
                    <div className="mt-3 inline-flex items-center rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-600">
                      Em Analise.
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <label className="text-sm text-muted-foreground">
                    Casa afiliada
                  </label>
                  <select
                    className="h-10 px-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    value={effectiveHouse}
                    onChange={(e) => setSelectedHouse(e.target.value)}
                  >
                    <option value="todas">Todas as casas</option>
                    {casasLoading ? (
                      <option value="" disabled>
                        Carregando...
                      </option>
                    ) : (
                      (casasVinculadas.some((c) => c.status === "active")
                        ? casasVinculadas.filter((c) => c.status === "active")
                        : casasVinculadas
                      ).map((casa) => (
                        <option key={casa.casinoId} value={casa.casinoId}>
                          {casa.casinoName}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {statsError && (
                <p className="text-destructive text-sm mb-4">{statsError}</p>
              )}
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {filteredStats.map((stat, index) => (
                  <Card
                    key={index}
                    className="bg-card/80 border-border/50 p-6 hover:border-primary/30 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`p-3 rounded-xl ${
                          stat.color === "primary"
                            ? "bg-principal-suave texto-destaque"
                            : "bg-secundario-suave texto-secundario"
                        }`}
                      >
                        <stat.icon className="w-6 h-6" />
                      </div>
                      {stat.change !== 0 && (
                        <div
                          className={`flex items-center gap-1 text-sm font-medium ${
                            stat.isPositive
                              ? "texto-destaque"
                              : "text-destructive"
                          }`}
                        >
                          {stat.isPositive ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                          {stat.change}
                        </div>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">
                      {stat.title}
                    </p>
                    <p className="text-xl font-display font-bold text-foreground">
                      {statsLoading ? "..." : stat.value}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Charts Section */}
              <Card className="bg-card/80 border-border/50 p-6 mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-lg font-display font-bold text-foreground">
                      Depósitos e FTDs
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Acompanhe o volume de depósitos e primeiros depósitos
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <select
                        className="h-10 pl-10 pr-4 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                      >
                        <option value="1">Ontem</option>
                        <option value="7">Última Semana</option>
                        <option value="30">Último Mês</option>
                        <option value="custom">Selecionar data</option>
                      </select>
                    </div>
                    {dateRange === "custom" && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          max={customEndDate || undefined}
                          className="h-10 px-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-muted-foreground text-sm">até</span>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          min={customStartDate || undefined}
                          className="h-10 px-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        {customStartDate &&
                          customEndDate &&
                          customEndDate < customStartDate && (
                            <span className="text-destructive text-xs">
                              A data final deve ser igual ou posterior à data
                              inicial.
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={filteredPerformanceData}>
                      <defs>
                        <linearGradient
                          id="colorDepositos"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="var(--cor-principal)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="var(--cor-principal)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorFTDs"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(45 85% 55%)"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(45 85% 55%)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(220 15% 20%)"
                      />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(220 10% 60%)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(220 10% 60%)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(220 18% 10%)",
                          border: "1px solid hsl(220 15% 20%)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="cliques"
                        name="Depósitos"
                        stroke="var(--cor-principal)"
                        fillOpacity={1}
                        fill="url(#colorDepositos)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="conversoes"
                        name="FTDs"
                        stroke="hsl(45 85% 55%)"
                        fillOpacity={1}
                        fill="url(#colorFTDs)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>


            </>
          ) : activeView === "contas_manager" && isManager ? (
            <Card className="bg-card/80 border-border/50 p-6">
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">
                  <span className="text-foreground">Contas que </span>
                  <span className="texto-gradiente-destaque">administro</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Contas que você pode visualizar e administrar (definidas pelo admin).
                </p>
              </div>
              {managedAccountsLoading ? (
                <p className="text-muted-foreground py-8">Carregando...</p>
              ) : managedAccounts.length === 0 ? (
                <p className="text-muted-foreground py-8 rounded-lg bg-muted/20 border border-border/50 text-center">
                  Nenhuma conta atribuída. O administrador pode vincular contas em Admin → Contas dos Managers.
                </p>
              ) : (
                <ul className="space-y-3">
                  {managedAccounts.map((acc) => (
                    <li
                      key={acc.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{acc.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            @{acc.username} · {acc.email}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : activeView === "plataformas" ? (
            <PlataformasD />
          ) : activeView === "links" ? (
            <LinkPage />
          ) : activeView === "carteira" ? (
            <CarteiraPage />
          ) : activeView === "entradas" ? (
            <EntradasPage embedded />
          ) : null}
        </main>
      </div>
      {isEmAnalise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="max-w-md mx-4 p-6 text-center shadow-lg border-border/60 bg-card/95">
            <h2 className="text-2xl font-display font-bold mb-2">
              Conta em análise
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Seu cadastro está em análise pela nossa equipe. Assim que for aprovado,
              seu painel será liberado para uso.
            </p>
            <Button variant="outline" onClick={logout}>
              Sair
            </Button>
          </Card>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Dashboard;
