import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiDelete, apiGet, apiPut } from "@/lib/api-client";
import type { AdminUserRow } from "../types";
import { getErrorMessage } from "../utils";

function isBlocked(user: AdminUserRow) {
  return Boolean(user.is_blocked);
}

export function UsersSection(props: { active: boolean }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);

  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockTarget, setBlockTarget] = useState<AdminUserRow | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<AdminUserRow[]>(
        `/admin/users?q=${encodeURIComponent(q.trim())}&limit=500`,
      );
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err) || "Falha ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!props.active) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.active]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) => {
      return (
        u.username?.toLowerCase().includes(query) ||
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    });
  }, [users, q]);

  const openBlockDialog = (u: AdminUserRow) => {
    setBlockTarget(u);
    setBlockReason(u.blocked_reason || "");
    setBlockDialogOpen(true);
  };

  const openDeleteDialog = (u: AdminUserRow) => {
    setDeleteTarget(u);
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  };

  const doBlockToggle = async () => {
    if (!blockTarget) return;
    const nextBlocked = !isBlocked(blockTarget);
    try {
      const updated = await apiPut<AdminUserRow>(`/admin/users/${blockTarget.id}/block`, {
        blocked: nextBlocked,
        reason: nextBlocked ? blockReason.trim() || null : null,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast({
        title: nextBlocked ? "Usuário bloqueado" : "Usuário desbloqueado",
        description: updated.email,
      });
      setBlockDialogOpen(false);
    } catch (err) {
      toast({
        title: "Erro",
        description: getErrorMessage(err) || "Falha ao atualizar usuário.",
        variant: "destructive",
      });
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
      toast({
        title: "Confirmação inválida",
        description: "Digite DELETE para confirmar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiDelete<{ ok: true }>(`/admin/users/${deleteTarget.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast({ title: "Usuário removido", description: deleteTarget.email });
      setDeleteDialogOpen(false);
    } catch (err) {
      toast({
        title: "Erro ao apagar",
        description: getErrorMessage(err) || "Falha ao apagar usuário.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display text-foreground">Usuários</h1>
          <p className="text-muted-foreground">
            Bloquear ou apagar usuários (punição administrativa).
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Buscar por nome, login ou email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full md:w-80 bg-muted/30 border-border/50"
          />
          <Button variant="outline" onClick={load} disabled={loading}>
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 border border-destructive/30 bg-destructive/10 text-destructive">
          {error}
        </Card>
      )}

      <Card className="border-border/50 overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Usuário</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Cadastro</th>
                <th className="text-right px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const blocked = isBlocked(u);
                return (
                  <tr key={u.id} className="border-t border-border/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{u.full_name}</div>
                      <div className="text-xs text-muted-foreground">@{u.username} · id {u.id}</div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            blocked
                              ? "bg-destructive/15 text-destructive"
                              : "bg-primary/15 text-primary"
                          }`}
                        >
                          {blocked ? "bloqueado" : "ativo"}
                        </span>
                        {!!u.is_manager && (
                          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
                            Manager
                          </span>
                        )}
                      </div>
                      {blocked && u.blocked_reason && (
                        <div className="text-xs text-muted-foreground mt-1 max-w-[28rem] truncate">
                          Motivo: {u.blocked_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {u.cadastro_status || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant={blocked ? "outline" : "destructive"}
                          onClick={() => openBlockDialog(u)}
                        >
                          {blocked ? "Desbloquear" : "Bloquear"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => openDeleteDialog(u)}
                        >
                          Apagar
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Carregando...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display">
              {blockTarget && isBlocked(blockTarget) ? "Desbloquear usuário" : "Bloquear usuário"}
            </DialogTitle>
            <DialogDescription>
              {blockTarget?.email}
            </DialogDescription>
          </DialogHeader>

          {blockTarget && !isBlocked(blockTarget) && (
            <div className="space-y-2">
              <label className="block text-sm text-muted-foreground">Motivo (opcional)</label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Ex: violação de termos, fraude..."
                className="bg-muted/30 border-border/50"
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant={blockTarget && isBlocked(blockTarget) ? "neon" : "destructive"}
              onClick={doBlockToggle}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive">Apagar usuário</DialogTitle>
            <DialogDescription>
              Isso remove o usuário e dados relacionados (por cascade). Para confirmar, digite
              DELETE.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm text-foreground">
              {deleteTarget?.full_name} ({deleteTarget?.email})
            </div>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Digite DELETE"
              className="bg-muted/30 border-border/50"
            />
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive" onClick={doDelete}>
              Apagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

