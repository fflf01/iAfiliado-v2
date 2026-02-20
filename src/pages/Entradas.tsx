import { useState } from "react";
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

const casas = ["Todas", "BrasilBet", "BetMGM", "LuvaBet", "BigBet", "BetMGM Pro", "SeuBet"];

interface DayEntry {
  date: string;
  casa: string;
  depositos: number;
  ftds: number;
  cpa: number;
  revshare: number;
  total: number;
}

const mockEntradas: DayEntry[] = [
  { date: "20/02/2026", casa: "BrasilBet",  depositos: 3200, ftds: 5,  cpa: 750,   revshare: 320, total: 1070 },
  { date: "20/02/2026", casa: "BetMGM",     depositos: 1500, ftds: 2,  cpa: 300,   revshare: 150, total: 450  },
  { date: "20/02/2026", casa: "LuvaBet",    depositos: 900,  ftds: 1,  cpa: 150,   revshare: 90,  total: 240  },
  { date: "20/02/2026", casa: "BigBet",     depositos: 600,  ftds: 1,  cpa: 150,   revshare: 60,  total: 210  },
  { date: "20/02/2026", casa: "BetMGM Pro", depositos: 2100, ftds: 3,  cpa: 450,   revshare: 210, total: 660  },
  { date: "20/02/2026", casa: "SeuBet",     depositos: 400,  ftds: 0,  cpa: 0,     revshare: 40,  total: 40   },
  { date: "19/02/2026", casa: "BrasilBet",  depositos: 2800, ftds: 4,  cpa: 600,   revshare: 280, total: 880  },
  { date: "19/02/2026", casa: "BetMGM",     depositos: 1200, ftds: 2,  cpa: 300,   revshare: 120, total: 420  },
  { date: "19/02/2026", casa: "LuvaBet",    depositos: 750,  ftds: 1,  cpa: 150,   revshare: 75,  total: 225  },
  { date: "19/02/2026", casa: "BigBet",     depositos: 1100, ftds: 2,  cpa: 300,   revshare: 110, total: 410  },
  { date: "19/02/2026", casa: "BetMGM Pro", depositos: 1800, ftds: 2,  cpa: 300,   revshare: 180, total: 480  },
  { date: "19/02/2026", casa: "SeuBet",     depositos: 500,  ftds: 1,  cpa: 150,   revshare: 50,  total: 200  },
  { date: "18/02/2026", casa: "BrasilBet",  depositos: 4100, ftds: 6,  cpa: 900,   revshare: 410, total: 1310 },
  { date: "18/02/2026", casa: "BetMGM",     depositos: 900,  ftds: 1,  cpa: 150,   revshare: 90,  total: 240  },
  { date: "18/02/2026", casa: "LuvaBet",    depositos: 600,  ftds: 0,  cpa: 0,     revshare: 60,  total: 60   },
  { date: "18/02/2026", casa: "BigBet",     depositos: 850,  ftds: 1,  cpa: 150,   revshare: 85,  total: 235  },
  { date: "18/02/2026", casa: "BetMGM Pro", depositos: 2500, ftds: 4,  cpa: 600,   revshare: 250, total: 850  },
  { date: "18/02/2026", casa: "SeuBet",     depositos: 300,  ftds: 0,  cpa: 0,     revshare: 30,  total: 30   },
  { date: "17/02/2026", casa: "BrasilBet",  depositos: 2200, ftds: 3,  cpa: 450,   revshare: 220, total: 670  },
  { date: "17/02/2026", casa: "BetMGM",     depositos: 1700, ftds: 3,  cpa: 450,   revshare: 170, total: 620  },
  { date: "17/02/2026", casa: "LuvaBet",    depositos: 400,  ftds: 0,  cpa: 0,     revshare: 40,  total: 40   },
  { date: "17/02/2026", casa: "BigBet",     depositos: 950,  ftds: 1,  cpa: 150,   revshare: 95,  total: 245  },
  { date: "17/02/2026", casa: "BetMGM Pro", depositos: 1300, ftds: 2,  cpa: 300,   revshare: 130, total: 430  },
  { date: "17/02/2026", casa: "SeuBet",     depositos: 700,  ftds: 1,  cpa: 150,   revshare: 70,  total: 220  },
];

interface EntradasProps {
  embedded?: boolean;
}

const Entradas = ({ embedded = false }: EntradasProps) => {
  const [casaSelecionada, setCasaSelecionada] = useState("Todas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [expandedDays, setExpandedDays] = useState<string[]>(["20/02/2026"]);

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

  const parseBrDate = (date: string) => {
    const [day, month, year] = date.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  const isWithinDateRange = (entryDate: string) => {
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
  };

  const filtradas = mockEntradas.filter((entry) => {
    const casaOk =
      casaSelecionada === "Todas" || entry.casa === casaSelecionada;
    return casaOk && isWithinDateRange(entry.date);
  });

  // Group by date
  const dates = [...new Set(filtradas.map(e => e.date))].sort((a, b) => {
    const [da, ma, ya] = a.split("/").map(Number);
    const [db, mb, yb] = b.split("/").map(Number);
    return new Date(yb, mb - 1, db).getTime() - new Date(ya, ma - 1, da).getTime();
  });

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

        {/* Entries grouped by day */}
        <div className="space-y-4">
          {dates.map(date => {
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
                      <p className="text-xs text-muted-foreground">{dayEntries.length} casa{dayEntries.length > 1 ? "s" : ""}</p>
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
          })}
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