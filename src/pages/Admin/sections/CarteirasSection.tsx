import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import type { UserWallet } from "../types";

export function CarteirasSection(props: {
  wallets: UserWallet[];
  search: string;
  onSearchChange: (value: string) => void;
  fmt: (v: number) => string;
}) {
  return (
    <Card className="bg-card/80 border-border/50 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Carteiras dos Usuários
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário..."
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            className="pl-10 bg-muted/30 border-border/50"
          />
        </div>
      </div>

      <div className="space-y-3">
        {props.wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">{wallet.usuario}</p>
                <p className="text-xs text-muted-foreground">{wallet.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Disponível</p>
                <p className="text-sm font-bold text-primary">
                  {props.fmt(wallet.saldoDisponivel)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Pendente</p>
                <p className="text-sm font-semibold text-secondary">
                  {props.fmt(wallet.saldoPendente)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total Sacado</p>
                <p className="text-sm font-semibold text-foreground">
                  {props.fmt(wallet.totalSacado)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Última Atividade</p>
                <p className="text-sm text-muted-foreground">
                  {wallet.ultimaAtividade}
                </p>
              </div>
            </div>
          </div>
        ))}

        {props.wallets.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            Nenhum usuário encontrado.
          </p>
        )}
      </div>
    </Card>
  );
}

