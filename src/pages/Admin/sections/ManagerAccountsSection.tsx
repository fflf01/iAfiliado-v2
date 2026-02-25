import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserCog, UserPlus, Trash2, Search, Loader2 } from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";
import type { ManagerRow, ManagedAccountRow, AdminUserRow } from "../types";
import { getErrorMessage } from "../utils";

export function ManagerAccountsSection(props: { active: boolean }) {
  const { toast } = useToast();
  const [managers, setManagers] = useState<ManagerRow[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<ManagedAccountRow[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<AdminUserRow[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [removingUserId, setRemovingUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!props.active) return;
    setLoadingManagers(true);
    setError(null);
    apiGet<ManagerRow[]>("/admin/managers")
      .then((data) => setManagers(Array.isArray(data) ? data : []))
      .catch((err) => setError(getErrorMessage(err) || "Falha ao carregar managers."))
      .finally(() => setLoadingManagers(false));
  }, [props.active]);

  useEffect(() => {
    if (!props.active || !selectedManagerId) {
      setAccounts([]);
      return;
    }
    setLoadingAccounts(true);
    apiGet<ManagedAccountRow[]>(`/admin/managers/${selectedManagerId}/accounts`)
      .then((data) => setAccounts(Array.isArray(data) ? data : []))
      .catch((err) => {
        toast({ title: "Erro", description: getErrorMessage(err), variant: "destructive" });
        setAccounts([]);
      })
      .finally(() => setLoadingAccounts(false));
  }, [props.active, selectedManagerId, toast]);

  const searchUsers = () => {
    const q = userSearch.trim();
    if (!q) {
      setUserSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    apiGet<AdminUserRow[]>(`/admin/users?q=${encodeURIComponent(q)}&limit=50`)
      .then((data) => setUserSearchResults(Array.isArray(data) ? data : []))
      .catch(() => setUserSearchResults([]))
      .finally(() => setSearchingUsers(false));
  };

  const addAccount = async (userId: number) => {
    if (!selectedManagerId) return;
    setAddingUserId(userId);
    try {
      const out = await apiPost<{ added: boolean; accounts: ManagedAccountRow[] }>(
        `/admin/managers/${selectedManagerId}/accounts`,
        { user_id: userId },
      );
      if (out?.accounts) setAccounts(out.accounts);
      toast({
        title: out?.added ? "Conta adicionada" : "Conta já vinculada",
        description: out?.added ? "O manager poderá visualizar e administrar esta conta." : "",
      });
      setAddDialogOpen(false);
      setUserSearch("");
      setUserSearchResults([]);
    } catch (err) {
      toast({
        title: "Erro ao adicionar",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setAddingUserId(null);
    }
  };

  const removeAccount = async (userId: number) => {
    if (!selectedManagerId) return;
    setRemovingUserId(userId);
    try {
      const out = await apiDelete<{ removed: boolean; accounts: ManagedAccountRow[] }>(
        `/admin/managers/${selectedManagerId}/accounts/${userId}`,
      );
      if (out?.accounts) setAccounts(out.accounts);
      toast({ title: "Conta removida", description: "O manager não terá mais acesso a esta conta." });
    } catch (err) {
      toast({
        title: "Erro ao remover",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setRemovingUserId(null);
    }
  };

  const selectedManager = managers.find((m) => String(m.id) === selectedManagerId);
  const managedIds = new Set(accounts.map((a) => a.id));
  const canAdd = !!selectedManagerId;

  return (
    <Card className="bg-card/80 border-border/50 p-6">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <UserCog className="w-7 h-7 text-primary" />
            Contas dos Managers
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Defina quais contas cada manager pode visualizar e administrar.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="w-full sm:w-80">
            <label className="text-xs text-muted-foreground block mb-1">Manager</label>
            <Select
              value={selectedManagerId ?? ""}
              onValueChange={(v) => setSelectedManagerId(v || null)}
              disabled={loadingManagers}
            >
              <SelectTrigger className="bg-muted/30 border-border/50">
                <SelectValue placeholder="Selecione um manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.full_name} (@{m.username})
                  </SelectItem>
                ))}
                {managers.length === 0 && !loadingManagers && (
                  <SelectItem value="_none" disabled>
                    Nenhum manager cadastrado
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {canAdd && (
            <Button
              variant="neon"
              size="sm"
              className="gap-2 mt-6 sm:mt-8"
              onClick={() => setAddDialogOpen(true)}
            >
              <UserPlus className="w-4 h-4" /> Adicionar conta
            </Button>
          )}
        </div>

        {selectedManager && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Contas que <span className="font-medium text-foreground">{selectedManager.full_name}</span> pode
              visualizar e administrar:
            </p>
            {loadingAccounts ? (
              <div className="flex items-center gap-2 text-muted-foreground py-8">
                <Loader2 className="w-5 h-5 animate-spin" /> Carregando...
              </div>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 rounded-lg bg-muted/20 border border-border/50 text-center">
                Nenhuma conta vinculada. Clique em &quot;Adicionar conta&quot; para permitir que este manager
                acesse contas específicas.
              </p>
            ) : (
              <ul className="space-y-2">
                {accounts.map((acc) => (
                  <li
                    key={acc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50 gap-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{acc.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        @{acc.username} · {acc.email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                      onClick={() => removeAccount(acc.id)}
                      disabled={removingUserId === acc.id}
                    >
                      {removingUserId === acc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Remover
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!selectedManagerId && !loadingManagers && managers.length > 0 && (
          <p className="text-sm text-muted-foreground py-4">
            Selecione um manager acima para ver e editar as contas que ele pode administrar.
          </p>
        )}
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar conta ao manager</DialogTitle>
            <DialogDescription>
              Busque um usuário por nome, login ou e-mail e clique para vincular à conta do manager
              selecionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, login ou e-mail..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                  className="pl-10 bg-muted/30 border-border/50"
                />
              </div>
              <Button variant="outline" onClick={searchUsers} disabled={searchingUsers}>
                {searchingUsers ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>
            <div className="max-h-64 overflow-auto space-y-1 rounded-lg border border-border/50 p-2">
              {userSearchResults
                .filter((u) => !managedIds.has(u.id))
                .map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-muted/50 flex items-center justify-between gap-2"
                    onClick={() => addAccount(u.id)}
                    disabled={addingUserId !== null}
                  >
                    <span className="text-sm">
                      {u.full_name} <span className="text-muted-foreground">@{u.username}</span>
                    </span>
                    {addingUserId === u.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <UserPlus className="w-4 h-4 text-primary" />
                    )}
                  </button>
                ))}
              {userSearchResults.length > 0 &&
                userSearchResults.every((u) => managedIds.has(u.id)) && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Todos os resultados já estão vinculados a este manager.
                  </p>
                )}
              {userSearch.trim() && !searchingUsers && userSearchResults.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Nenhum usuário encontrado. Tente outro termo.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
