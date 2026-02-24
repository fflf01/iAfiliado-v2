import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Building2, Edit, Pause, Plus, Search, Trash2 } from "lucide-react";
import type { Casino } from "../types";

export function CasinosSection(props: {
  casinos: Casino[];
  search: string;
  onSearchChange: (value: string) => void;
  fmt: (v: number) => string;
  onOpenNew: () => void;
  onEdit: (c: Casino) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="bg-card/80 border-border/50 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Casinos Afiliados
        </h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar casino..."
              value={props.search}
              onChange={(e) => props.onSearchChange(e.target.value)}
              className="pl-10 bg-muted/30 border-border/50"
            />
          </div>
          <Button
            variant="neon"
            size="sm"
            className="gap-2"
            onClick={props.onOpenNew}
          >
            <Plus className="w-4 h-4" /> Novo
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {props.casinos.map((casino) => (
          <div
            key={casino.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-foreground">{casino.nome}</p>
                <p className="text-xs text-muted-foreground">{casino.urlAfiliado}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">CPA</p>
                <p className="text-sm font-semibold text-foreground">
                  {props.fmt(casino.comissaoCPA)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Rev Share</p>
                <p className="text-sm font-semibold text-foreground">
                  {casino.comissaoRevShare}%
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  casino.status === "ativo"
                    ? "bg-primary/15 text-primary"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {casino.status === "ativo" ? "Ativo" : "Inativo"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => props.onEdit(casino)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => props.onToggleStatus(casino.id)}
                >
                  <Pause className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => props.onDelete(casino.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {props.casinos.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            Nenhum casino encontrado.
          </p>
        )}
      </div>
    </Card>
  );
}

