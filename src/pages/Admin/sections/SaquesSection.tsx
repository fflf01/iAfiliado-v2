import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Banknote } from "lucide-react";
import type { WithdrawalRowApi } from "../types";
import { formatDatePtBr, getErrorMessage } from "../utils";

export function SaquesSection(props: {
  withdrawals: WithdrawalRowApi[];
  withdrawalUpdating: string | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  fmt: (v: number) => string;
}) {
  return (
    <Card className="bg-card/80 border-border/50 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Verificação de saque
        </h2>
        <p className="text-sm text-muted-foreground">
          Solicitações de saque enviadas pelos usuários. Aprove ou rejeite cada
          uma.
        </p>
      </div>
      <div className="space-y-3">
        {props.withdrawals.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            Nenhuma solicitação de saque.
          </p>
        ) : (
          props.withdrawals.map((w) => (
            <div
              key={w.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{w.user_name}</p>
                  <p className="text-xs text-muted-foreground">{w.user_email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDatePtBr(w.created_at)} • {w.metodo}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-lg font-display font-bold text-foreground">
                  {props.fmt(w.valor)}
                </p>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    w.status === "pendente"
                      ? "bg-secondary/15 text-secondary"
                      : w.status === "aprovado"
                        ? "bg-primary/15 text-primary"
                        : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                </span>
                {w.status === "pendente" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                      disabled={props.withdrawalUpdating === w.id}
                      onClick={() => props.onReject(w.id)}
                    >
                      <XCircle className="w-4 h-4" /> Rejeitar
                    </Button>
                    <Button
                      size="sm"
                      variant="neon"
                      className="gap-1"
                      disabled={props.withdrawalUpdating === w.id}
                      onClick={() => props.onApprove(w.id)}
                    >
                      <CheckCircle className="w-4 h-4" /> Aprovar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

