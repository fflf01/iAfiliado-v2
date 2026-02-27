import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Copy,
  Check,
  ExternalLink,
  Plus,
  BarChart3,
  MousePointer,
  Users,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost } from "@/lib/api-client";

interface CasaVinculada {
  casinoId: string;
  casinoName: string;
  status: string;
  link: string | null;
  /** Múltiplos links por cassino (API pode enviar links[] ou apenas link) */
  links?: string[];
}

interface CasinoDoBanco {
  id: string;
  name: string;
  url: string | null;
  urlAfiliado: string | null;
  comissaoCpa: number;
  comissaoRevshare: number;
  description: string | null;
}

interface MeEntrada {
  casinoId: string;
  cliques: number;
  ftd: number;
}

const Links = () => {
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showNewLinkForm, setShowNewLinkForm] = useState(false);
  const [casas, setCasas] = useState<CasaVinculada[]>([]);
  const [casasLoading, setCasasLoading] = useState(true);
  const [casinos, setCasinos] = useState<CasinoDoBanco[]>([]);
  const [casinosLoading, setCasinosLoading] = useState(false);
  const [entradas, setEntradas] = useState<MeEntrada[]>([]);

  useEffect(() => {
    let cancelled = false;
    setCasasLoading(true);
    apiGet<CasaVinculada[]>("/me/casas")
      .then((data) => {
        if (!cancelled) setCasas(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCasas([]);
      })
      .finally(() => {
        if (!cancelled) setCasasLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showNewLinkForm) return;
    let cancelled = false;
    setCasinosLoading(true);
    apiGet<CasinoDoBanco[]>("/casinos")
      .then((data) => {
        if (!cancelled) setCasinos(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCasinos([]);
      })
      .finally(() => {
        if (!cancelled) setCasinosLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showNewLinkForm]);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ casinoId: string; cliques: number; ftd: number; casinoName?: string }[]>("/me/entradas")
      .then((data) => {
        if (!cancelled && Array.isArray(data)) {
          setEntradas(data.map((e) => ({ casinoId: e.casinoId, cliques: e.cliques || 0, ftd: e.ftd || 0 })));
        }
      })
      .catch(() => {
        if (!cancelled) setEntradas([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totais = useMemo(() => {
    const cliques = entradas.reduce((s, e) => s + e.cliques, 0);
    const conversoes = entradas.reduce((s, e) => s + e.ftd, 0);
    return { cliques, conversoes };
  }, [entradas]);

  const casinoIdsVinculados = useMemo(() => new Set(casas.map((c) => c.casinoId)), [casas]);

  /** Lista de links de uma casa: usa links[] se existir, senão [link] se houver link */
  const linksDeCasa = (casa: CasaVinculada): string[] => {
    if (casa.links && casa.links.length > 0) return casa.links;
    if (casa.link) return [casa.link];
    return [];
  };
  const casinosParaNovoLink = useMemo(
    () => casinos.filter((c) => !casinoIdsVinculados.has(c.id)),
    [casinos, casinoIdsVinculados],
  );

  const copyToClipboard = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(id);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const copyId = (casinoId: string, index: number) => `${casinoId}-${index}`;

  const cliquesPorCasino = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of entradas) {
      m[e.casinoId] = (m[e.casinoId] || 0) + e.cliques;
    }
    return m;
  }, [entradas]);

  const conversoesPorCasino = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of entradas) {
      m[e.casinoId] = (m[e.casinoId] || 0) + e.ftd;
    }
    return m;
  }, [entradas]);

  const solicitarAcesso = async (platformName: string) => {
    try {
      await apiPost<{ ok: boolean; id: string; status: string }>("/me/contracts", {
        platformName,
      });
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação foi enviada para análise. Após aprovação, seu link aparecerá aqui.",
      });
      setShowNewLinkForm(false);
      apiGet<CasaVinculada[]>("/me/casas").then((data) => setCasas(Array.isArray(data) ? data : []));
    } catch (err) {
      toast({
        title: "Erro ao solicitar",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              <span className="text-foreground">Meus </span>
              <span className="text-gradient-neon">Links</span>
            </h1>
            <p className="text-muted-foreground">
              Casas vinculadas à sua conta e seus links de afiliado
            </p>
          </div>
          <Button
            variant="neon"
            className="gap-2"
            onClick={() => setShowNewLinkForm(!showNewLinkForm)}
          >
            <Plus className="w-4 h-4" />
            Novo Link
          </Button>
        </div>

        {/* Novo Link: lista de casinos do banco */}
        {showNewLinkForm && (
          <Card className="bg-card/80 border-border/50 p-6 mb-8">
            <h2 className="text-xl font-display font-bold text-foreground mb-4">
              Solicitar novo link (plataformas cadastradas)
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              Escolha uma plataforma para solicitar acesso. Após aprovação pelo admin, seu link de afiliado aparecerá em Meus Links.
            </p>
            {casinosLoading ? (
              <p className="text-muted-foreground">Carregando plataformas...</p>
            ) : casinosParaNovoLink.length === 0 ? (
              <p className="text-muted-foreground">
                {casinos.length === 0
                  ? "Nenhuma plataforma cadastrada no momento."
                  : "Você já solicitou ou possui link para todas as plataformas disponíveis."}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {casinosParaNovoLink.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <span className="font-medium text-foreground">{c.name}</span>
                    <Button
                      variant="neon"
                      size="sm"
                      onClick={() => solicitarAcesso(c.name)}
                    >
                      Solicitar acesso
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setShowNewLinkForm(false)}
            >
              Fechar
            </Button>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/80 border-border/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <MousePointer className="w-6 h-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total de Cliques</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {totais.cliques.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-card/80 border-border/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Conversões (FTD)</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {totais.conversoes.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-card/80 border-border/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Casas vinculadas</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {casas.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de links (casas vinculadas da conta) */}
        <div className="space-y-4">
          {casasLoading ? (
            <p className="text-muted-foreground">Carregando seus links...</p>
          ) : casas.length === 0 ? (
            <Card className="bg-card/80 border-border/50 p-8 text-center">
              <p className="text-muted-foreground mb-4">
                Você ainda não tem casas vinculadas. Solicite acesso em &quot;Novo Link&quot; ou em Casas Parceiras.
              </p>
              <Button variant="neon" asChild>
                <Link to="/dashboard/plataformas">Ver plataformas</Link>
              </Button>
            </Card>
          ) : (
            casas.map((casa) => (
              <Card
                key={casa.casinoId}
                className="bg-card/80 border-border/50 p-6 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display font-bold text-foreground text-lg">
                        {casa.casinoName}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          casa.status === "active"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {casa.status === "active" ? "Ativo" : casa.status}
                      </span>
                    </div>
                    <div className="space-y-2 mb-3 rounded-lg border border-primary/30 bg-primary/5 p-3 shadow-sm">
                      {linksDeCasa(casa).length > 0 ? (
                        linksDeCasa(casa).map((url, idx) => (
                          <div
                            key={copyId(casa.casinoId, idx)}
                            className="flex items-center gap-2 flex-wrap"
                          >
                            <p className="text-muted-foreground text-sm font-mono flex-1 min-w-0 truncate">
                              {url}
                            </p>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(url, copyId(casa.casinoId, idx))}
                                title="Copiar link"
                              >
                                {copiedLink === copyId(casa.casinoId, idx) ? (
                                  <Check className="w-4 h-4 text-primary" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                title="Abrir link"
                                onClick={() => {
                                  if (url.startsWith("http://") || url.startsWith("https://")) {
                                    window.open(url, "_blank", "noopener,noreferrer");
                                  }
                                }}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm font-mono">
                          Link pendente (aguardando definição pelo admin)
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <MousePointer className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">
                          {(cliquesPorCasino[casa.casinoId] ?? 0).toLocaleString()} cliques
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-secondary" />
                        <span className="text-muted-foreground">
                          {conversoesPorCasino[casa.casinoId] ?? 0} conversões (FTD)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {linksDeCasa(casa).length === 0 && (
                      <span className="text-sm text-muted-foreground">Aguardando link</span>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Links;
