import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Clock, Eye, LinkOff, Search, XCircle } from "lucide-react";
import type { ContractRequest, Solicitacao } from "../types";
import { tipoClienteLabel } from "../utils";

const statusOptions = ["todos", "pendente", "aprovado"];
const contractStatusOptions = ["todos", "pendente", "aprovado", "rejeitado"];

type BaseFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filtroStatus: string;
  onFiltroStatusChange: (value: string) => void;
};

type CadastroProps = BaseFiltersProps & {
  totalPendentes: number;
  solicitacoes: Solicitacao[];
  onOpenDetail: (s: Solicitacao) => void;
  onApproveSolicitacao: (id: number) => void;
  onRejectSolicitacao: (id: number) => void;
};

type ContratoProps = BaseFiltersProps & {
  contractPendentesCount: number;
  contractRequests: ContractRequest[];
  allContractRequests?: ContractRequest[];
  onApproveContract: (id: string, link?: string) => void;
  onRejectContract: (id: string) => void;
  onLinkStatusChange?: (contractId: string, status: "on" | "off") => Promise<void>;
};

export function SolicitacoesCadastroSection(props: CadastroProps) {
  return (
    <Card className="bg-card/80 border-border/50 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Solicitações de Cadastro
          </h2>
          <p className="text-sm text-muted-foreground">
            {props.totalPendentes} pendente
            {props.totalPendentes !== 1 ? "s" : ""} de análise
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
              props.filtroStatus === st
                ? "bg-primary text-primary-foreground"
                : ""
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
                  {sol.contatoAnalise
                    ? ` • Contato: ${sol.contatoAnalise}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Login</p>
                <p className="text-sm font-medium text-foreground">
                  @{sol.login}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="text-sm text-muted-foreground">
                  {sol.dataCadastro}
                </p>
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
              {sol.is_manager && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
                  Manager
                </span>
              )}
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
    </Card>
  );
}

export function SolicitacoesContratoSection(props: ContratoProps) {
  const [approveContractDialogOpen, setApproveContractDialogOpen] =
    useState(false);
  const [selectedContractRequest, setSelectedContractRequest] =
    useState<ContractRequest | null>(null);
  const [contractLinkInput, setContractLinkInput] = useState("");
  const [subTab, setSubTab] = useState<"lista" | "status">("lista");
  const [linkStatusUpdating, setLinkStatusUpdating] = useState<string | null>(null);

  const allContracts = props.allContractRequests ?? props.contractRequests;
  const approvedForStatusTab = allContracts.filter((c) => c.status === "aprovado");

  const openApproveContractDialog = (req: ContractRequest) => {
    setSelectedContractRequest(req);
    setContractLinkInput("");
    setApproveContractDialogOpen(true);
  };

  const confirmApproveContract = () => {
    if (!selectedContractRequest) return;
    props.onApproveContract(
      selectedContractRequest.id,
      contractLinkInput.trim() || undefined,
    );
    setApproveContractDialogOpen(false);
    setSelectedContractRequest(null);
    setContractLinkInput("");
  };

  const handleLinkStatus = async (id: string, status: "on" | "off") => {
    if (!props.onLinkStatusChange) return;
    setLinkStatusUpdating(id);
    try {
      await props.onLinkStatusChange(id, status);
    } finally {
      setLinkStatusUpdating(null);
    }
  };

  return (
    <Card className="bg-card/80 border-border/50 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Solicitações de Contrato
          </h2>
          <p className="text-sm text-muted-foreground">
            Contratos permanecem na lista. Links concedidos = On, desligados = Off.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por afiliado ou casa..."
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            className="pl-10 bg-muted/30 border-border/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button
          size="sm"
          variant={subTab === "lista" ? "default" : "outline"}
          onClick={() => setSubTab("lista")}
        >
          Lista
        </Button>
        <Button
          size="sm"
          variant={subTab === "status" ? "default" : "outline"}
          onClick={() => setSubTab("status")}
        >
          Status
        </Button>
      </div>

      {subTab === "lista" && (
        <>
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {contractStatusOptions.map((st) => (
              <Button
                key={st}
                size="sm"
                variant={props.filtroStatus === st ? "default" : "outline"}
                onClick={() => props.onFiltroStatusChange(st)}
                className={
                  props.filtroStatus === st
                    ? "bg-primary text-primary-foreground"
                    : ""
                }
              >
                {st === "todos"
                  ? "Todos"
                  : st.charAt(0).toUpperCase() + st.slice(1) + "s"}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            {props.contractRequests.map((req) => {
              const linkOn = req.status === "aprovado" && req.linkStatus === "on";
              const linkOff = req.status === "aprovado" && req.linkStatus === "off";
              return (
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
                      <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                        Casa:{" "}
                        <span className="text-foreground font-medium">
                          {req.casaNome}
                        </span>
                        {req.status === "aprovado" && (
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              linkOn ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {linkOn ? "On" : "Off"}
                          </span>
                        )}
                      </p>
                      {req.tipoComissao && (
                        <p className="text-xs text-muted-foreground">
                          Comissão:{" "}
                          <span className="text-foreground font-medium">
                            {req.tipoComissao === "deposito"
                              ? "Depósito"
                              : req.tipoComissao === "cpa"
                                ? "CPA"
                                : req.tipoComissao === "revshare"
                                  ? "RevShare"
                                  : req.tipoComissao}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Data</p>
                      <p className="text-sm text-muted-foreground">
                        {req.dataCriacao}
                      </p>
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
                    {req.status === "aprovado" && props.onLinkStatusChange && (
                      <div className="flex items-center gap-2">
                        {linkOn && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={linkStatusUpdating === req.id}
                            onClick={() => handleLinkStatus(req.id, "off")}
                            className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                            title="Desligar link"
                          >
                            <LinkOff className="w-4 h-4" /> Desligar link
                          </Button>
                        )}
                        {linkOff && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={linkStatusUpdating === req.id}
                            onClick={() => handleLinkStatus(req.id, "on")}
                            className="gap-1 text-primary border-primary/30 hover:bg-primary/10"
                            title="Religar link"
                          >
                            <CheckCircle className="w-4 h-4" /> Religar link
                          </Button>
                        )}
                      </div>
                    )}
                    {req.status === "pendente" && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openApproveContractDialog(req)}
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
              );
            })}

            {props.contractRequests.length === 0 && (
              <p className="text-center py-8 text-muted-foreground">
                Nenhuma solicitação de contrato encontrada.
              </p>
            )}
          </div>
        </>
      )}

      {subTab === "status" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Status dos links: On = link concedido, Off = link desligado.
          </p>
          {approvedForStatusTab.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum contrato aprovado para exibir status do link.
            </p>
          ) : (
            approvedForStatusTab.map((req) => {
              const linkOn = req.linkStatus === "on";
              return (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 gap-4"
                >
                  <div>
                    <p className="font-bold text-foreground">{req.afiliadoNome}</p>
                    <p className="text-xs text-muted-foreground">
                      {req.afiliadoEmail} • Casa: {req.casaNome}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        linkOn ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {linkOn ? "On" : "Off"}
                    </span>
                    {props.onLinkStatusChange && (
                      linkOn ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={linkStatusUpdating === req.id}
                          onClick={() => handleLinkStatus(req.id, "off")}
                          className="gap-1 text-destructive border-destructive/30"
                        >
                          <LinkOff className="w-4 h-4" /> Desligar link
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={linkStatusUpdating === req.id}
                          onClick={() => handleLinkStatus(req.id, "on")}
                          className="gap-1 text-primary border-primary/30"
                        >
                          <CheckCircle className="w-4 h-4" /> Religar link
                        </Button>
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <Dialog
        open={approveContractDialogOpen}
        onOpenChange={setApproveContractDialogOpen}
      >
        <DialogContent className="bg-card border-border/50 max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar solicitação de contrato</DialogTitle>
            <DialogDescription>
              Confirme os dados e insira o link de afiliado da casa para o
              usuário.
            </DialogDescription>
          </DialogHeader>
          {selectedContractRequest && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/30 border border-border/50 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {selectedContractRequest.afiliadoNome}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedContractRequest.afiliadoEmail}
                  {selectedContractRequest.afiliadoPhone
                    ? ` • ${selectedContractRequest.afiliadoPhone}`
                    : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Casa:{" "}
                  <span className="text-foreground font-medium">
                    {selectedContractRequest.casaNome}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Data: {selectedContractRequest.dataCriacao}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Link da casa
                </label>
                <Input
                  placeholder="Cole o link de afiliado da casa solicitada"
                  value={contractLinkInput}
                  onChange={(e) => setContractLinkInput(e.target.value)}
                  className="bg-muted/30 border-border/50"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. O usuário verá este link em Meus Links após a
                  aprovação.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setApproveContractDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="neon"
              onClick={confirmApproveContract}
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Confirmar aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
