import { Card } from "@/components/ui/card";
import type { Casino, EntradaAdmin, UserWallet, WithdrawalRowApi } from "../types";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Building2,
  Calendar,
  Wallet,
  Banknote,
  DollarSign,
  BarChart2,
  TrendingUp,
} from "lucide-react";

export function OverviewSection(props: {
  casinos: Casino[];
  entradas: EntradaAdmin[];
  wallets: UserWallet[];
  withdrawals: WithdrawalRowApi[];
  pendentesCount: number;
  contractPendentesCount: number;
  totalDepositos: number;
  totalCPA: number;
  totalRevShare: number;
  totalSaldoUsuarios: number;
  fmt: (v: number) => string;
  onNavigate: (tabId: string) => void;
}) {
  const totalPendencias = props.pendentesCount + props.contractPendentesCount;

  return (
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
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Depósitos</span>
          </div>
          <p className="text-2xl font-bold font-display text-foreground">
            {props.fmt(props.totalDepositos)}
          </p>
        </Card>
        <Card className="bg-card/80 border-border/50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <BarChart2 className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-sm text-muted-foreground">Total CPA</span>
          </div>
          <p className="text-2xl font-bold font-display text-foreground">
            {props.fmt(props.totalCPA)}
          </p>
        </Card>
        <Card className="bg-card/80 border-border/50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <span className="text-sm text-muted-foreground">Total Rev Share</span>
          </div>
          <p className="text-2xl font-bold font-display text-foreground">
            {props.fmt(props.totalRevShare)}
          </p>
        </Card>
        <Card className="bg-card/80 border-border/50 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Saldo Usuários</span>
          </div>
          <p className="text-2xl font-bold font-display text-foreground">
            {props.fmt(props.totalSaldoUsuarios)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: "solicitacoes_cadastro",
            icon: ClipboardList,
            title: "Solicitações de Cadastro",
            desc: `${props.pendentesCount} pendentes`,
            color: "text-secondary",
          },
          {
            id: "solicitacoes_contrato",
            icon: ClipboardList,
            title: "Solicitações de Contrato",
            desc: `${props.contractPendentesCount} pendentes`,
            color: "text-secondary",
          },
          {
            id: "casinos",
            icon: Building2,
            title: "Casinos",
            desc: `${props.casinos.length} casinos cadastrados`,
            color: "text-primary",
          },
          {
            id: "entradas",
            icon: Calendar,
            title: "Entradas",
            desc: `${props.entradas.length} registros`,
            color: "text-secondary",
          },
          {
            id: "carteiras",
            icon: Wallet,
            title: "Carteiras",
            desc: `${props.wallets.length} usuários`,
            color: "text-primary",
          },
          {
            id: "saques",
            icon: Banknote,
            title: "Verificação de saque",
            desc: `${props.withdrawals.filter((w) => w.status === "pendente").length} pendentes`,
            color: "text-secondary",
          },
        ].map((card) => (
          <Card
            key={card.id}
            className="bg-card/80 border-border/50 p-6 cursor-pointer hover:border-primary/30 transition-all"
            onClick={() => props.onNavigate(card.id)}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-muted/30">
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-foreground font-display">
                  {card.title}
                </p>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
                {card.id === "solicitacoes" && totalPendencias > 0 && (
                  <div className="mt-2">
                    <Button size="sm" variant="outline">
                      {totalPendencias} pendência{totalPendencias !== 1 ? "s" : ""}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

