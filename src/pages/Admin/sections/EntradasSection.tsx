import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { EntradaAdmin } from "../types";

export function EntradasSection(props: {
  entradas: EntradaAdmin[];
  search: string;
  onSearchChange: (value: string) => void;
  filtroTipo: string;
  onFiltroTipoChange: (value: string) => void;
  fmt: (v: number) => string;
  formatDate: (value: string) => string;
}) {
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

  return (
    <Card className="bg-card/80 border-border/50 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Auditoria de Entradas
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por usuário ou casa..."
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            className="pl-10 bg-muted/30 border-border/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {["todos", "deposito", "cpa", "ftd", "revshare"].map((tipo) => (
          <Button
            key={tipo}
            size="sm"
            variant={props.filtroTipo === tipo ? "default" : "outline"}
            onClick={() => props.onFiltroTipoChange(tipo)}
            className={
              props.filtroTipo === tipo ? "bg-primary text-primary-foreground" : ""
            }
          >
            {tipo === "todos" ? "Todos" : tipoLabel(tipo)}
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="grid grid-cols-6 gap-2 px-4 py-3 bg-muted/20 rounded-t-lg text-xs font-medium text-muted-foreground min-w-[700px]">
          <span>Usuário</span>
          <span>Casa</span>
          <span>Tipo</span>
          <span className="text-right">Valor</span>
          <span className="text-right">Data</span>
          <span className="text-right">Email</span>
        </div>

        <div className="space-y-1 min-w-[700px]">
          {props.entradas.map((entrada) => (
            <div
              key={entrada.id}
              className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-border/30 hover:bg-muted/10 transition-colors items-center"
            >
              <span className="text-sm font-medium text-foreground">
                {entrada.usuario}
              </span>
              <span className="text-sm text-foreground">{entrada.casa}</span>
              <span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tipoBadge(entrada.tipo)}`}
                >
                  {tipoLabel(entrada.tipo)}
                </span>
              </span>
              <span className="text-sm text-right font-semibold text-foreground">
                {["ftd", "cpa"].includes(entrada.tipo)
                  ? entrada.valor
                  : props.fmt(entrada.valor)}
              </span>
              <span className="text-sm text-right text-muted-foreground">
                {props.formatDate(entrada.data)}
              </span>
              <span className="text-sm text-right text-muted-foreground truncate">
                {entrada.email}
              </span>
            </div>
          ))}

          {props.entradas.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              Nenhuma entrada encontrada.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

