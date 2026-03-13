import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { User as AppUser } from "@/types";
import type { AdminUserCasaVinculada, AdminUserStats, ClientRow } from "../types";

type DateRange = "1" | "7" | "30" | "custom";

export function UserDashboardSection(props: {
  clients: ClientRow[];
  userId: number | null;
  userQuery: string;
  onUserQueryChange: (value: string) => void;
  onUserIdChange: (id: number | null) => void;

  selectedHouse: string;
  onSelectedHouseChange: (value: string) => void;

  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  customStart: string;
  onCustomStartChange: (value: string) => void;
  customEnd: string;
  onCustomEndChange: (value: string) => void;

  loading: boolean;
  error: string | null;
  profile: AppUser | null;
  casas: AdminUserCasaVinculada[];
  stats: AdminUserStats;
  performanceData: { name: string; cliques: number; conversoes: number }[];
}) {
  const q = props.userQuery.trim().toLowerCase();
  const filteredClients = !q
    ? props.clients
    : props.clients.filter((c) => {
        return (
          c.full_name?.toLowerCase().includes(q) ||
          c.username?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
        );
      });

  return (
    <Card className="bg-card/80 border-border/50 p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Dashboard de Usuário
          </h2>
          <p className="text-sm text-muted-foreground">
            Selecione um usuário cadastrado para visualizar estatísticas e
            entradas.
          </p>
        </div>
        <div className="w-full md:w-[420px] space-y-2">
          <Input
            placeholder="Filtrar por nome, @login ou email..."
            value={props.userQuery}
            onChange={(e) => props.onUserQueryChange(e.target.value)}
            className="bg-muted/30 border-border/50"
          />
          <Select
            value={props.userId !== null ? String(props.userId) : undefined}
            onValueChange={(value) =>
              props.onUserIdChange(value ? Number(value) : null)
            }
          >
            <SelectTrigger className="h-10 w-full px-3">
              <SelectValue placeholder="Selecione um usuário..." />
            </SelectTrigger>
            <SelectContent>
              {filteredClients.slice(0, 200).map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.full_name} (@{c.username}) — {c.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {props.error && (
        <p className="text-destructive text-sm mb-4">{props.error}</p>
      )}

      {!props.userId ? (
        <p className="text-muted-foreground text-sm">
          Escolha um usuário para carregar o dashboard.
        </p>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Visualizando</p>
              <p className="text-lg font-display font-bold text-foreground">
                {props.profile?.full_name || "Usuário"}
                {props.profile?.username ? ` (@${props.profile.username})` : ""}
              </p>
              {props.profile?.email && (
                <p className="text-sm text-muted-foreground">
                  {props.profile.email}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <label className="text-sm text-muted-foreground">
                Casa afiliada
              </label>
              <Select
                value={props.selectedHouse}
                onValueChange={(value) => props.onSelectedHouseChange(value)}
              >
                <SelectTrigger className="h-10 w-full px-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as casas</SelectItem>
                  {props.casas.map((c) => (
                    <SelectItem key={c.casinoId} value={c.casinoId}>
                      {c.casinoName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total de Cliques",
                value: props.stats.totalCliques,
                fmt: (v: number) => Math.round(v).toLocaleString("pt-BR"),
              },
              {
                label: "Depósito",
                value: props.stats.totalDepositos,
                fmt: (v: number) => Math.round(v).toLocaleString("pt-BR"),
              },
              {
                label: "Comissão Total",
                value: props.stats.comissaoTotal,
                fmt: (v: number) => `R$ ${Math.round(v).toLocaleString("pt-BR")}`,
              },
              {
                label: "FTDs",
                value: props.stats.totalFtds,
                fmt: (v: number) => Math.round(v).toLocaleString("pt-BR"),
              },
            ].map((s) => (
              <Card key={s.label} className="bg-card/80 border-border/50 p-6">
                <p className="text-muted-foreground text-sm mb-1">{s.label}</p>
                <p className="text-xl font-display font-bold text-foreground">
                  {props.loading ? "..." : s.fmt(s.value)}
                </p>
              </Card>
            ))}
          </div>

          <Card className="bg-card/80 border-border/50 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
              <div>
                <h3 className="text-lg font-display font-bold text-foreground">
                  Depósitos e FTDs
                </h3>
                <p className="text-muted-foreground text-sm">
                  Entradas do usuário no período selecionado
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Select
                    value={props.dateRange}
                    onValueChange={(value) =>
                      props.onDateRangeChange(value as DateRange)
                    }
                  >
                    <SelectTrigger className="h-10 pl-10 pr-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Ontem</SelectItem>
                      <SelectItem value="7">Última Semana</SelectItem>
                      <SelectItem value="30">Último Mês</SelectItem>
                      <SelectItem value="custom">Selecionar data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {props.dateRange === "custom" && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <input
                      type="date"
                      value={props.customStart}
                      onChange={(e) => props.onCustomStartChange(e.target.value)}
                      max={props.customEnd || undefined}
                      className="h-10 px-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <span className="text-muted-foreground text-sm">até</span>
                    <input
                      type="date"
                      value={props.customEnd}
                      onChange={(e) => props.onCustomEndChange(e.target.value)}
                      min={props.customStart || undefined}
                      className="h-10 px-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={props.performanceData}>
                  <defs>
                    <linearGradient
                      id="adminDashDepositos"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(145 80% 42%)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(145 80% 42%)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="adminDashFTDs" x1="0" y1="0" x2="0" y2="1">
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
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
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
                    stroke="hsl(145 80% 42%)"
                    fillOpacity={1}
                    fill="url(#adminDashDepositos)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="conversoes"
                    name="FTDs"
                    stroke="hsl(45 85% 55%)"
                    fillOpacity={1}
                    fill="url(#adminDashFTDs)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </Card>
  );
}

