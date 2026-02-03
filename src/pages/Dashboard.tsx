import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Footer from "@/components/Footer";
import {
  Crown,
  TrendingUp,
  Users,
  DollarSign,
  MousePointer,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Link as LinkIcon,
  Wallet,
  HelpCircle,
  FileText,
  Gem,
  Rocket,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import "@/Stilos/stilo.scss";
import PlataformasD from "./Plataformas_D";

// Define a interface do usuário para tipagem
interface User {
  id: number;
  name: string;
  login: string;
  email: string;
  is_admin: boolean;
}

// Mock data for charts
const performanceData = [
  { name: "Jan", cliques: 400, conversoes: 24, comissao: 240 },
  { name: "Fev", cliques: 300, conversoes: 18, comissao: 180 },
  { name: "Mar", cliques: 520, conversoes: 32, comissao: 320 },
  { name: "Abr", cliques: 480, conversoes: 29, comissao: 290 },
  { name: "Mai", cliques: 600, conversoes: 38, comissao: 380 },
  { name: "Jun", cliques: 750, conversoes: 48, comissao: 480 },
  { name: "Jul", cliques: 820, conversoes: 52, comissao: 520 },
];

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

const stats = [
  {
    title: "Total de Cliques",
    value: "3.870",
    change: "+12.5%",
    isPositive: true,
    icon: MousePointer,
    color: "primary",
  },
  {
    title: "Conversões",
    value: "241",
    change: "+8.2%",
    isPositive: true,
    icon: Users,
    color: "secondary",
  },
  {
    title: "Comissão Total",
    value: "R$ 4.850",
    change: "+15.3%",
    isPositive: true,
    icon: DollarSign,
    color: "primary",
  },
  {
    title: "Taxa de Conversão",
    value: "6.2%",
    change: "-0.8%",
    isPositive: false,
    icon: TrendingUp,
    color: "secondary",
  },
];

const API_BASE_URL = "http://localhost:3000";

const Dashboard = () => {
  const location = useLocation();
  const activeView = location.pathname.includes("/plataformas")
    ? "plataformas"
    : "dashboard";
  const [dateRange, setDateRange] = useState("7d");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const sidebarItems = [
    { icon: LinkIcon, label: "DashBoard", id: "dashboard", path: "/dashboard" },
    {
      icon: Wallet,
      label: "Casas Parceiras",
      id: "plataformas",
      path: "/dashboard/plataformas",
    },
    { icon: Crown, label: "Meus Links", path: "/como-funciona" },
    { icon: Rocket, label: "Carteira", path: "/como-funciona" },
    {
      icon: HelpCircle,
      label: "fale com suporte",
      path: user?.is_admin ? "/suporteadmin" : "/suporte-cliente",
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (!token) {
      navigate("/login");
      return;
    }
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error("Erro ao analisar dados do usuário:", error);
      }
    }
  }, [navigate]);

  const copyToClipboard = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold texto-gradiente-secundario">
              <img src="/iAfiliado.png" alt="iAfiliado" className="h-36" />
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-muted-foreground hidden sm:block">
              Olá,{" "}
              <span className="text-foreground font-medium">
                {user?.name || "Afiliado"}
              </span>
            </span>
            {user?.is_admin && (
              <Link to="/suporteadmin">
                <Button className="gap-2 btn-principal" size="sm">
                  <Shield className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <Card className="bg-card/50 border-border/50 p-4 sticky top-24">
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
                    <span className="font-medium">{item.label}</span>
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
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                  <span className="text-foreground">Painel do </span>
                  <span className="texto-gradiente-destaque">Afiliado</span>
                </h1>
                <p className="text-muted-foreground">
                  Acompanhe suas estatísticas e gerencie seus links de afiliado
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat, index) => (
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
                    </div>
                    <p className="text-muted-foreground text-sm mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-display font-bold text-foreground">
                      {stat.value}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Charts Section */}
              <Card className="bg-card/80 border-border/50 p-6 mb-8">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-xl font-display font-bold text-foreground">
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
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Último mês</option>
                        <option value="yesterday">Ontem</option>
                        <option value="custom">Selecionar data</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData}>
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

              {/* Links and Payment History */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Affiliate Links */}
                <Card id="links" className="bg-card/80 border-border/50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-display font-bold text-foreground">
                        Links de Afiliado
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Copie e compartilhe seus links
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Novo Link
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {affiliateLinks.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all"
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-medium text-foreground mb-1">
                            {link.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {link.url}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(link.url, link.id)}
                          className="shrink-0"
                        >
                          {copiedLink === link.id ? (
                            <Check className="w-4 h-4 texto-destaque" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Payment History */}
                <Card className="bg-card/80 border-border/50 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-display font-bold text-foreground">
                        Histórico de Pagamentos
                      </h2>
                      <p className="text-muted-foreground text-sm">
                        Seus últimos pagamentos
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      Ver Todos
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {paymentHistory.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-lg ${
                              payment.status === "pago"
                                ? "bg-principal-suave texto-destaque"
                                : "bg-secundario-suave texto-secundario"
                            }`}
                          >
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              R$ {payment.valor.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {payment.data} • {payment.metodo}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            payment.status === "pago"
                              ? "bg-principal-suave texto-destaque"
                              : "bg-secundario-suave texto-secundario"
                          }`}
                        >
                          {payment.status === "pago" ? "Pago" : "Pendente"}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          ) : activeView === "plataformas" ? (
            <PlataformasD />
          ) : null}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
