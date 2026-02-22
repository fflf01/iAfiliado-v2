import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
import "@/Stilos/stilo.css";
import { useAuth } from "@/hooks/useAuth";
import { apiGet } from "@/lib/api-client";
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

const Dashboard = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [meStats, setMeStats] = useState<MeStats>(defaultStats);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [meEntradas, setMeEntradas] = useState<MeEntrada[]>([]);

  useEffect(() => {
    let cancelled = false;
    setStatsError(null);
    setStatsLoading(true);
    apiGet<MeStats>("/me/stats")
      .then((data) => {
        if (!cancelled) {
          setMeStats(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatsError("Não foi possível carregar as estatísticas.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setStatsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiGet<MeEntrada[]>("/me/entradas")
      .then((data) => {
        if (!cancelled) {
          setMeEntradas(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMeEntradas([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeView = location.pathname.includes("/plataformas")
    ? "plataformas"
    : location.pathname.includes("/entradas")
      ? "entradas"
    : location.pathname.includes("/links")
      ? "links"
      : location.pathname.includes("/carteira")
        ? "carteira"
        : "dashboard";

  const [dateRange, setDateRange] = useState("7");
  const [selectedHouse, setSelectedHouse] = useState("todas");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const sidebarItems = [
    { icon: LinkIcon, label: "DashBoard", id: "dashboard", path: "/dashboard" },
    { icon: CalendarDays, label: "Entradas", id: "entradas", path: "/entradas" },
    { icon: Wallet, label: "Casas Parceiras", id: "plataformas", path: "/dashboard/plataformas" },
    { icon: Crown, label: "Meus Links", id: "links", path: "/dashboard/links" },
    { icon: Rocket, label: "Carteira", id: "carteira", path: "/dashboard/carteira" },
    { icon: HelpCircle, label: "Fale com Suporte", id: "suporte", path: user?.is_admin ? "/suporteadmin" : "/suporte-cliente" },
  ];

  const houseMultipliers: Record<string, number> = {
    todas: 1,
    bet365: 0.85,
    betano: 0.7,
    stake: 1.1,
    "1xbet": 0.6,
    sportingbet: 0.75,
  };

  const currentMultiplier = houseMultipliers[selectedHouse] ?? 1;

  const baseStats = useMemo(() => {
    return statTemplates.map((t) => ({
      ...t,
      value: meStats[t.key],
    }));
  }, [meStats]);

  const filteredStats = useMemo(() => {
    return baseStats.map((stat) => {
      const scaledValue = stat.value * currentMultiplier;
      const formattedValue =
        stat.format === "currency"
          ? `R$ ${scaledValue.toLocaleString("pt-BR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`
          : Math.round(scaledValue).toLocaleString("pt-BR");

      return {
        ...stat,
        value: formattedValue,
      };
    });
  }, [baseStats, currentMultiplier]);

  const performanceData = useMemo(
    () => aggregateEntradasByMonth(meEntradas),
    [meEntradas]
  );

  const filteredPerformanceData = useMemo(() => {
    return performanceData.map((item) => ({
      ...item,
      cliques: Math.round(item.cliques * currentMultiplier),
      conversoes: Math.round(item.conversoes * currentMultiplier),
    }));
  }, [performanceData, currentMultiplier]);

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
                {user?.full_name || "Afiliado"}
              </span>
            </span>
            {user?.is_admin && (
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
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <label className="text-sm text-muted-foreground">
                    Casa afiliada
                  </label>
                  <select
                    className="h-10 px-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    value={selectedHouse}
                    onChange={(e) => setSelectedHouse(e.target.value)}
                  >
                    <option value="todas">Todas as casas</option>
                    <option value="bet365">Bet365</option>
                    <option value="betano">Betano</option>
                    <option value="stake">Stake</option>
                    <option value="1xbet">1xBet</option>
                    <option value="sportingbet">Sportingbet</option>
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
      <Footer />
    </div>
  );
};

export default Dashboard;
