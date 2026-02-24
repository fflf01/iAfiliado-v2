import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, Eye, Search, XCircle } from "lucide-react";
import type { ContractRequest, Solicitacao } from "../types";
import { tipoClienteLabel } from "../utils";

export function SolicitacoesSection(props: {
  totalPendencias: number;
  pendentesCount: number;
  contractPendentesCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  filtroStatus: string;
  onFiltroStatusChange: (value: string) => void;
  solicitacoes: Solicitacao[];
  contractRequests: ContractRequest[];
  onOpenDetail: (s: Solicitacao) => void;
  onApproveSolicitacao: (id: number) => void;
  onRejectSolicitacao: (id: number) => void;
  onApproveContract: (id: string) => void;
  onRejectContract: (id: string) => void;
}) {
  const statusOptions = ["todos", "pendente", "aprovado", "rejeitado"];

  return (
    <Card className="bg-card/80 border-border/50 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Solicitações de Cadastro
          </h2>
          <p className="text-sm text-muted-foreground">
            {props.totalPendencias} pendente
            {props.totalPendencias !== 1 ? "s" : ""} de análise
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            className="pl-10 bg-muted/30 border-border/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {statusOptions.map((st) => (
          <Button
            key={st}
            size="sm"
            variant={props.filtroStatus === st ? "default" : "outline"}
            onClick={() => props.onFiltroStatusChange(st)}
            className={
              props.filtroStatus === st ? "bg-primary text-primary-foreground" : ""
            }
          >
            {st === "todos"
              ? "Todos"
              : st.charAt(0).toUpperCase() + st.slice(1) + "s"}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {props.solicitacoes.map((sol) => (
          <div
            key={sol.id}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all gap-4"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  sol.status === "pendente"
                    ? "bg-secondary/10"
                    : sol.status === "aprovado"
                      ? "bg-primary/10"
                      : "bg-destructive/10"
                }`}
              >
                {sol.status === "pendente" ? (
                  <Clock className="w-5 h-5 text-secondary" />
                ) : sol.status === "aprovado" ? (
                  <CheckCircle className="w-5 h-5 text-primary" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="font-bold text-foreground">{sol.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {sol.email} • {sol.telefone}
                </p>
                <p className="text-xs text-muted-foreground">
                  Opção:{" "}
                  <span className="text-foreground font-medium">
                    {tipoClienteLabel(sol.tipoCliente)}
                  </span>
                  {sol.contatoAnalise ? ` • Contato: ${sol.contatoAnalise}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Login</p>
                <p className="text-sm font-medium text-foreground">@{sol.login}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="text-sm text-muted-foreground">{sol.dataCadastro}</p>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  sol.status === "pendente"
                    ? "bg-secondary/15 text-secondary"
                    : sol.status === "aprovado"
                      ? "bg-primary/15 text-primary"
                      : "bg-destructive/15 text-destructive"
                }`}
              >
                {sol.status.charAt(0).toUpperCase() + sol.status.slice(1)}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => props.onOpenDetail(sol)}
                  title="Ver detalhes"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {sol.status === "pendente" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => props.onApproveSolicitacao(sol.id)}
                      className="text-primary hover:text-primary"
                      title="Aprovar"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => props.onRejectSolicitacao(sol.id)}
                      className="text-destructive hover:text-destructive"
                      title="Rejeitar"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {props.solicitacoes.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            Nenhuma solicitação encontrada.
          </p>
        )}
      </div>

      <div className="mt-10 pt-6 border-t border-border/40">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl font-display font-bold text-foreground">
              Solicitações de Contrato
            </h3>
            <p className="text-sm text-muted-foreground">
              {props.contractPendentesCount} pendente
              {props.contractPendentesCount !== 1 ? "s" : ""} de vínculo com casa
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {props.contractRequests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 hover:border-primary/30 transition-all gap-4"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    req.status === "pendente"
                      ? "bg-secondary/10"
                      : req.status === "aprovado"
                        ? "bg-primary/10"
                        : "bg-destructive/10"
                  }`}
                >
                  {req.status === "pendente" ? (
                    <Clock className="w-5 h-5 text-secondary" />
                  ) : req.status === "aprovado" ? (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  ) : (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-foreground">{req.afiliadoNome}</p>
                  <p className="text-xs text-muted-foreground">
                    {req.afiliadoEmail}
                    {req.afiliadoPhone ? ` • ${req.afiliadoPhone}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Casa:{" "}
                    <span className="text-foreground font-medium">
                      {req.casaNome}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Data</p>
                  <p className="text-sm text-muted-foreground">{req.dataCriacao}</p>
                </div>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    req.status === "pendente"
                      ? "bg-secondary/15 text-secondary"
                      : req.status === "aprovado"
                        ? "bg-primary/15 text-primary"
                        : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
                {req.status === "pendente" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => props.onApproveContract(req.id)}
                      className="text-primary hover:text-primary"
                      title="Aprovar"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => props.onRejectContract(req.id)}
                      className="text-destructive hover:text-destructive"
                      title="Rejeitar"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {props.contractRequests.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              Nenhuma solicitação de contrato encontrada.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

