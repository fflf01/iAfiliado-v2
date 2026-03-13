import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Shield, Zap, Globe, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api-client";
import { resolveCasinoLogo } from "@/lib/casino-logo";
import { useToast } from "@/hooks/use-toast";
import enegiaLogo from "@/assets/logos/Enegia.png";
import bravoLogo from "@/assets/logos/Bravo.png";
import mcGamesLogo from "@/assets/logos/MCGames.png";
import playBetLogo from "@/assets/logos/PlayBet.png";
import galeraBetLogo from "@/assets/logos/Galerabet.png";
import braBetLogo from "@/assets/logos/BraBet.png";
import betDaSorteLogo from "@/assets/logos/BetdaSorte.png";
import estrelaBetLogo from "@/assets/logos/estrelabet.png";

const platformsFallback = [
  {
    name: "Energia Bet",
    logo: enegiaLogo,
    commission: "11% dos depósitos",
    features: ["Pagamento Semanal", "Saque rápido", "Suporte 24h"],
  },
  {
    name: "Bravo Bet",
    logo: bravoLogo,
    commission: "10% dos depósitos",
    features: ["Pagamento Semanal"],
  },
  {
    name: "MC Games",
    logo: mcGamesLogo,
    commission: "10% dos depósitos",
    features: ["Pagamento Semanal"],
  },
  {
    name: "Play Bet",
    logo: playBetLogo,
    commission: "R$100 de CPA",
    features: ["BaseLine R$25", "Pagamento Mensal", "Suporte 24h"],
  },
  {
    name: "Galera Bet",
    logo: galeraBetLogo,
    commission: "11% dos depósitos",
    features: ["Pagamento Semanal", "Saque rápido", "Suporte 24h"],
  },
  {
    name: "BraBet",
    logo: braBetLogo,
    commission: "10% dos Depósitos",
    features: ["BaseLine R$25", "Suporte 24h"],
  },
  {
    name: "Bet da Sorte",
    logo: betDaSorteLogo,
    commission: "R$80 de CPA",
    features: ["BaseLine R$25", "Pagamento Semanal", "Suporte 24h"],
  },
  {
    name: "EstrelaBet",
    logo: estrelaBetLogo,
    commission: "10% dos depósitos",
    features: ["Pagamento Semanal"],
  },
];

interface PublicCasino {
  id: string;
  name: string;
  url: string | null;
  urlAfiliado: string | null;
  comissaoCpa: number;
  comissaoRevshare: number;
  comissaoDepositoc: number;
  paymentType: string | null;
  description: string | null;
}

type CommissionType = "deposito" | "cpa" | "revshare";

function commissionLabel(c: PublicCasino, tipo: CommissionType): string {
  if (tipo === "cpa") {
    return `R$${Math.round(c.comissaoCpa)} de CPA`;
  }
  if (tipo === "revshare") {
    return `${c.comissaoRevshare}% RevShare`;
  }
  // deposito
  return `${c.comissaoDepositoc}% dos depósitos`;
}

function logoForCasino(c: PublicCasino): string {
  return resolveCasinoLogo(c.name, c.id);
}

const Plataformas = () => {
  const { toast } = useToast();
  const [casinos, setCasinos] = useState<PublicCasino[] | null>(null);
  const [search, setSearch] = useState("");
  const [filterCommissionType, setFilterCommissionType] = useState<CommissionType | "todos">(
    "todos",
  );
  const [filterPaymentType, setFilterPaymentType] = useState<"todos" | "semanal" | "quinzenal" | "mensal">(
    "todos",
  );

  async function solicitarContrato(platformName: string, commissionType?: CommissionType) {
    try {
      await apiPost<{ ok: true; id: string; status: string }>("/me/contracts", {
        platformName,
        commissionType,
      });
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação foi enviada para análise.",
      });
    } catch (err) {
      toast({
        title: "Erro ao solicitar",
        description: err instanceof Error ? err.message : "Erro inesperado.",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    let cancelled = false;
    apiGet<PublicCasino[]>("/casinos")
      .then((data) => {
        if (cancelled) return;
        setCasinos(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setCasinos(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const platforms = useMemo(
    () => {
      if (!casinos) return platformsFallback as {
        name: string;
        logo: string;
        commission: string;
        features: string[];
        commissionType?: CommissionType;
        paymentType?: string | null;
      }[];

      const result: {
        name: string;
        logo: string;
        commission: string;
        features: string[];
        commissionType?: CommissionType;
        paymentType?: string | null;
      }[] = [];

      casinos.forEach((c) => {
      const logo = logoForCasino(c);
      const paymentLabel =
        c.paymentType === "mensal"
          ? "Pagamento Mensal"
          : c.paymentType === "quinzenal"
            ? "Pagamento Quinzenal"
            : "Pagamento Semanal";
      const baseFeatures = [
        paymentLabel,
        ...(c.description ? [c.description] : []),
      ];

        if (c.comissaoDepositoc > 0) {
          result.push({
            name: c.name,
            logo,
            commission: commissionLabel(c, "deposito"),
            features: baseFeatures,
            commissionType: "deposito",
            paymentType: c.paymentType,
          });
        }
        if (c.comissaoCpa > 0) {
          result.push({
            name: c.name,
            logo,
            commission: commissionLabel(c, "cpa"),
            features: baseFeatures,
            commissionType: "cpa",
            paymentType: c.paymentType,
          });
        }
        if (c.comissaoRevshare > 0) {
          result.push({
            name: c.name,
            logo,
            commission: commissionLabel(c, "revshare"),
            features: baseFeatures,
            commissionType: "revshare",
            paymentType: c.paymentType,
          });
        }
      });

      return result.length ? result : (platformsFallback as {
        name: string;
        logo: string;
        commission: string;
        features: string[];
        commissionType?: CommissionType;
        paymentType?: string | null;
      }[]);
    },
    [casinos],
  );

  const filteredPlatforms = useMemo(() => {
    const q = search.trim().toLowerCase();

    return platforms.filter((p) => {
      // Filtro por tipo de comissão
      if (filterCommissionType !== "todos" && p.commissionType !== filterCommissionType) {
        return false;
      }

      // Filtro por tipo de pagamento (usa paymentType normalizado)
      const pt = (p.paymentType || "semanal").toLowerCase();
      if (filterPaymentType !== "todos" && pt !== filterPaymentType) {
        return false;
      }

      if (!q) return true;

      const paymentLabel = p.features[0]?.toLowerCase() ?? "";
      const commissionTypeLabel =
        p.commissionType === "deposito"
          ? "deposito"
          : p.commissionType === "cpa"
            ? "cpa"
            : p.commissionType === "revshare"
              ? "revshare"
              : "";

      const haystack = [
        p.name.toLowerCase(),
        p.commission.toLowerCase(),
        paymentLabel,
        commissionTypeLabel,
      ].join(" ");

      return haystack.includes(q);
    });
  }, [platforms, search, filterCommissionType, filterPaymentType]);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Title */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            <span className="text-foreground">Nossas </span>
            <span className="text-gradient-neon">Plataformas</span>
          </h1>
          <p className="text-muted-foreground">
            Trabalhe com as melhores casas de apostas e maximize seus ganhos
          </p>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              className="w-full rounded-md border border-border/50 bg-muted/30 px-3 py-2 pl-9 text-sm text-foreground"
              placeholder="Buscar por casa, comissão ou pagamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <select
            className="w-full md:w-40 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground"
            value={filterCommissionType}
            onChange={(e) =>
              setFilterCommissionType(
                e.target.value as CommissionType | "todos",
              )
            }
          >
            <option value="todos">Todas comissões</option>
            <option value="deposito">Depósito</option>
            <option value="cpa">CPA</option>
            <option value="revshare">RevShare</option>
          </select>
          <select
            className="w-full md:w-44 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm text-foreground"
            value={filterPaymentType}
            onChange={(e) =>
              setFilterPaymentType(
                e.target.value as "todos" | "semanal" | "quinzenal" | "mensal",
              )
            }
          >
            <option value="todos">Todos pagamentos</option>
            <option value="semanal">Pagamento semanal</option>
            <option value="quinzenal">Pagamento quinzenal</option>
            <option value="mensal">Pagamento mensal</option>
          </select>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="flex flex-wrap gap-6 mb-8 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="w-4 h-4 text-primary" />
          <span>Licenciadas e Regulamentadas</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Zap className="w-4 h-4 text-primary" />
          <span>Pagamentos Garantidos</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Globe className="w-4 h-4 text-primary" />
          <span>Alcance Global</span>
        </div>
      </div>

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlatforms.map((platform, index) => (
          <div
            key={index}
            className="relative bg-card/80 rounded-xl p-6 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Logo */}
            <div className="flex items-center gap-4 mb-5">
              <div className="w-16 h-16 rounded-xl bg-muted/50 flex items-center justify-center overflow-hidden p-2">
                <img
                  src={platform.logo}
                  alt={`Logo ${platform.name}`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/200x80/1e293b/ffffff?text=${platform.name.replace(" ", "+")}`;
                    e.currentTarget.onerror = null;
                  }}
                />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-foreground">
                  {platform.name}
                </h3>
              </div>
            </div>

            {/* Commission */}
            <div className="mb-5 p-4 bg-muted/30 rounded-lg border border-border/30">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Comissão
              </span>
              <div className="text-2xl font-display font-bold text-gradient-gold">
                {platform.commission}
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-6">
              {platform.features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm text-muted-foreground"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variant="neonOutline"
              className="w-full h-10 text-xs font-semibold uppercase tracking-wide"
                  onClick={() =>
                    solicitarContrato(
                      platform.name,
                      platform.commissionType as CommissionType | undefined,
                    )
                  }
            >
              Acessar
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-12 text-center py-8 px-6 bg-card/50 rounded-xl border border-border/50">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
          Não encontrou sua{" "}
          <span className="text-gradient-gold">plataforma</span>?
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
          Entre em contato conosco e solicite a inclusão de novas casas
          parceiras.
        </p>
        <Button variant="neonOutline" size="lg" asChild className="h-11">
          <Link to="/suporte-cliente">Falar com Suporte</Link>
        </Button>
      </div>
    </div>
  );
};

export default Plataformas;
