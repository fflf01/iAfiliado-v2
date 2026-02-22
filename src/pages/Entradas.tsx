import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  DollarSign,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Filter,
} from "lucide-react";
import { apiGet } from "@/lib/api-client";

interface DayEntry {
  date: string;
  casa: string;
  depositos: number;
  ftds: number;
  cpa: number;
  revshare: number;
  total: number;
}

interface MeEntrada {
  id: string;
  casinoId: string;
  dataHora: number;
  depositos: number;
  cliques: number;
  registros: number;
  ftd: number;
  valorRecebido: number;
  casinoName: string;
}

function formatDateBr(ms: number): string {
  const d = new Date(ms);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function mapEntradasToDayEntries(entradas: MeEntrada[]): DayEntry[] {
  return entradas.map((e) => ({
    date: formatDateBr(e.dataHora),
    casa: e.casinoName,
    depositos: e.depositos,
    ftds: e.ftd,
    cpa: 0,
    revshare: e.valorRecebido,
    total: e.valorRecebido,
  }));
}

interface EntradasProps {
  embedded?: boolean;
}

const Entradas = ({ embedded = false }: EntradasProps) => {
  const [casaSelecionada, setCasaSelecionada] = useState("Todas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [entradas, setEntradas] = useState<MeEntrada[]>([]);
  const [entradasLoading, setEntradasLoading] = useState(true);
  const [entradasError, setEntradasError] = useState<string | null>(null);

  const dayEntries = useMemo(() => mapEntradasToDayEntries(entradas), [entradas]);
  const casas = useMemo(() => {
    const names = [...new Set(dayEntries.map((e) => e.casa))].sort();
    return ["Todas", ...names];
  }, [dayEntries]);

  const [expandedDays, setExpandedDays] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setEntradasError(null);
    setEntradasLoading(true);
    apiGet<MeEntrada[]>("/me/entradas")
      .then((data) => {
        if (!cancelled) {
          setEntradas(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEntradasError("Não foi possível carregar as entradas.");
          setEntradas([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setEntradasLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleDataInicioChange = (newDate: string) => {
    if (dataFim && newDate && newDate > dataFim) {
      return;
    }
    setDataInicio(newDate);
  };

  const handleDataFimChange = (newDate: string) => {
    if (dataInicio && newDate && newDate < dataInicio) {
      return;
    }
    setDataFim(newDate);
  };

  const intervaloInvalido = Boolean(dataInicio && dataFim && dataInicio > dataFim);

  const parseBrDate = useCallback((date: string) => {
    const [day, month, year] = date.split("/").map(Number);
    return new Date(year, month - 1, day);
  }, []);

  const isWithinDateRange = useCallback(
    (entryDate: string) => {
      const entryTime = parseBrDate(entryDate).getTime();
      if (dataInicio) {
        const startTime = new Date(`${dataInicio}T00:00:00`).getTime();
        if (entryTime < startTime) return false;
      }
      if (dataFim) {
        const endTime = new Date(`${dataFim}T23:59:59`).getTime();
        if (entryTime > endTime) return false;
      }
      return true;
    },
    [dataInicio, dataFim, parseBrDate]
  );

  const filtradas = useMemo(() => {
    return dayEntries.filter((entry) => {
      const casaOk =
        casaSelecionada === "Todas" || entry.casa === casaSelecionada;
      return casaOk && isWithinDateRange(entry.date);
    });
  }, [dayEntries, casaSelecionada, isWithinDateRange]);

  const datesFiltered = useMemo(() => {
    const set = new Set(filtradas.map((e) => e.date));
    return [...set].sort((a, b) => {
      const [da, ma, ya] = a.split("/").map(Number);
      const [db, mb, yb] = b.split("/").map(Number);
      return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime();
    });
  }, [filtradas]);

  // Expandir o primeiro dia quando houver datas e expandedDays estiver vazio
  useEffect(() => {
    if (datesFiltered.length > 0 && expandedDays.length === 0) {
      setExpandedDays([datesFiltered[0]]);
    }
  }, [datesFiltered, expandedDays.length]);

  const toggleDay = (date: string) => {
    setExpandedDays(prev =>
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const getDayTotals = (date: string) => {
    const dayEntries = filtradas.filter(e => e.date === date);
    return {
      depositos: dayEntries.reduce((s, e) => s + e.depositos, 0),
      ftds: dayEntries.reduce((s, e) => s + e.ftds, 0),
      cpa: dayEntries.reduce((s, e) => s + e.cpa, 0),
      revshare: dayEntries.reduce((s, e) => s + e.revshare, 0),
      total: dayEntries.reduce((s, e) => s + e.total, 0),
    };
  };

  const globalTotals = {
    depositos: filtradas.reduce((s, e) => s + e.depositos, 0),
    ftds: filtradas.reduce((s, e) => s + e.ftds, 0),
    cpa: filtradas.reduce((s, e) => s + e.cpa, 0),
    revshare: filtradas.reduce((s, e) => s + e.revshare, 0),
    total: filtradas.reduce((s, e) => s + e.total, 0),
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const content = (
    <main className={embedded ? "py-2" : "container mx-auto px-4 py-8"}>
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-1">
            <span className="text-foreground">Minhas </span>
            <span className="text-gradient-neon">Entradas</span>
          </h1>
          <p className="text-muted-foreground">Acompanhe depósitos, FTDs e comissões por casa</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/80 border-border/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Depósitos</span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{fmt(globalTotals.depositos)}</p>
          </Card>
          <Card className="bg-card/80 border-border/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-sm text-muted-foreground">Total FTDs</span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{globalTotals.ftds}</p>
          </Card>
          <Card className="bg-card/80 border-border/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart2 className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">CPA Total</span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{fmt(globalTotals.cpa)}</p>
          </Card>
          <Card className="bg-card/80 border-border/50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <TrendingUp className="w-5 h-5 text-secondary" />
              </div>
              <span className="text-sm text-muted-foreground">Rev Share Total</span>
            </div>
            <p className="text-2xl font-bold font-display text-foreground">{fmt(globalTotals.revshare)}</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {casas.map(casa => (
              <Button
                key={casa}
                size="sm"
                variant={casaSelecionada === casa ? "default" : "outline"}
                onClick={() => setCasaSelecionada(casa)}
                className={casaSelecionada === casa ? "bg-primary text-primary-foreground" : ""}
              >
                {casa}
              </Button>
            ))}
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">De</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => handleDataInicioChange(e.target.value)}
                max={dataFim || undefined}
                className="h-10 px-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Até</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => handleDataFimChange(e.target.value)}
                min={dataInicio || undefined}
                className="h-10 px-3 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {(dataInicio || dataFim) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDataInicio("");
                  setDataFim("");
                }}
              >
                Limpar datas
              </Button>
            )}
          </div>
          {intervaloInvalido && (
            <p className="text-xs text-destructive">
              A data inicial nunca pode ser maior que a data final.
            </p>
          )}
        </div>

        {entradasError && (
          <p className="text-destructive text-sm mb-4">{entradasError}</p>
        )}
        {/* Entries grouped by day */}
        <div className="space-y-4">
          {entradasLoading ? (
            <p className="text-muted-foreground text-sm">Carregando entradas...</p>
          ) : datesFiltered.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma entrada encontrada.</p>
          ) : (
          datesFiltered.map(date => {
            const dayTotals = getDayTotals(date);
            const dayEntries = filtradas.filter(e => e.date === date);
            const isExpanded = expandedDays.includes(date);

            return (
              <Card key={date} className="bg-card/80 border-border/50 overflow-hidden">
                {/* Day Header */}
                <button
                  onClick={() => toggleDay(date)}
                  className="w-full flex items-center justify-between p-5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-foreground font-display">{date}</p>
                      <p className="text-xs text-muted-foreground">{dayEntries.length} casa{dayEntries.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 md:gap-10">
                    <div className="hidden md:flex gap-8 text-sm">
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">Depósitos</p>
                        <p className="font-semibold text-foreground">{fmt(dayTotals.depositos)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">FTDs</p>
                        <p className="font-semibold text-foreground">{dayTotals.ftds}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">CPA</p>
                        <p className="font-semibold text-foreground">{fmt(dayTotals.cpa)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground text-xs">Rev Share</p>
                        <p className="font-semibold text-foreground">{fmt(dayTotals.revshare)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-bold text-primary font-display text-lg">{fmt(dayTotals.total)}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded rows per casa */}
                {isExpanded && (
                  <div className="border-t border-border/50">
                    {/* Table Header */}
                    <div className="grid grid-cols-6 gap-2 px-5 py-2 bg-muted/20 text-xs text-muted-foreground font-medium">
                      <span>Casa</span>
                      <span className="text-right">Depósitos</span>
                      <span className="text-right">FTDs</span>
                      <span className="text-right">CPA</span>
                      <span className="text-right">Rev Share</span>
                      <span className="text-right">Total</span>
                    </div>
                    {dayEntries.map((entry, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-6 gap-2 px-5 py-3 border-t border-border/30 hover:bg-muted/10 transition-colors items-center"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm font-medium text-foreground">{entry.casa}</span>
                        </div>
                        <span className="text-sm text-right text-foreground">{fmt(entry.depositos)}</span>
                        <span className="text-sm text-right">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${entry.ftds > 0 ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground"}`}>
                            {entry.ftds}
                          </span>
                        </span>
                        <span className="text-sm text-right text-foreground">{fmt(entry.cpa)}</span>
                        <span className="text-sm text-right text-foreground">{fmt(entry.revshare)}</span>
                        <span className="text-sm text-right font-bold text-primary">{fmt(entry.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })
          )}
        </div>
      </main>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/iAfiliado.png" alt="iAfiliado" className="h-14 md:h-16" />
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4">{content}</div>
    </div>
  );
};

export default Entradas;