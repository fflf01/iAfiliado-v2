import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/api-client";
import type { AdminLogRow } from "../types";
import { formatDatePtBr, getErrorMessage } from "../utils";

function fmtDate(value: string) {
  // admin_logs.created_at é datetime('now') -> string sqlite. Mantém simples.
  try {
    const dt = new Date(value);
    if (!Number.isNaN(dt.getTime())) return formatDatePtBr(dt.toISOString());
  } catch {
    // ignore
  }
  return value;
}

export function AdminLogsSection(props: { active: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [logs, setLogs] = useState<AdminLogRow[]>([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<AdminLogRow[]>(
        `/admin/log_admin?q=${encodeURIComponent(q.trim())}&limit=500&offset=0`,
      );
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err) || "Falha ao carregar log_admin.");
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
    if (!query) return logs;
    return logs.filter((l) => {
      return (
        l.action?.toLowerCase().includes(query) ||
        l.target_type?.toLowerCase().includes(query) ||
        (l.target_id || "").toLowerCase().includes(query) ||
        (l.message || "").toLowerCase().includes(query) ||
        (l.admin_email || "").toLowerCase().includes(query)
      );
    });
  }, [logs, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-display text-foreground">Log Admin</h1>
          <p className="text-muted-foreground">
            Auditoria de mudanças feitas via painel administrativo.
          </p>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Filtrar por action, email, target..."
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
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Admin</th>
                <th className="text-left px-4 py-3">Ação</th>
                <th className="text-left px-4 py-3">Target</th>
                <th className="text-left px-4 py-3">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-border/40 align-top">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {fmtDate(l.created_at)}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    <div className="font-medium">{l.admin_email || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.admin_username ? `@${l.admin_username}` : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground whitespace-nowrap">{l.action}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {l.target_type}
                    {l.target_id ? `:${l.target_id}` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {l.message || "—"}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum log encontrado.
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
    </div>
  );
}

