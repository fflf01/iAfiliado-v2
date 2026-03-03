import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Shield, Zap, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiGet, apiPost } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import brasilbetLogo from "@/assets/brasilbet.png";
import betsulLogo from "@/assets/betsul.png";
import multibetLogo from "@/assets/Multibet.png";
import mgmbetLogo from "@/assets/MGMbet.png";
import mgmbetProLogo from "@/assets/MGMbet Pro.png";
import luvabetLogo from "@/assets/luvabet.png";
import bigbetLogo from "@/assets/Bigbet.png";
import seubetLogo from "@/assets/seubet.png";

const platformsFallback = [
  {
    name: "BrasilBet",
    logo: brasilbetLogo,
    commission: "11% dos depósitos",
    features: ["Pagamento Semanal", "Saque rápido", "Suporte 24h"],
  },
  {
    name: "BetSul",
    logo: betsulLogo,
    commission: "10% dos depósitos",
    features: ["Pagamento Semanal"],
  },
  {
    name: "Multibet",
    logo: multibetLogo,
    commission: "10% dos depósitos",
    features: ["Pagamento Semanal"],
  },
  {
    name: "BetMGM",
    logo: mgmbetLogo,
    commission: "R$100 de CPA",
    features: ["BaseLine R$25", "Pagamento Mensal", "Suporte 24h"],
  },
  {
    name: "LuvaBet",
    logo: luvabetLogo,
    commission: "11% dos depósitos",
    features: ["Pagamento Semanal", "Saque rápido", "Suporte 24h"],
  },
  {
    name: "BigBet",
    logo: bigbetLogo,
    commission: "10% dos Depósitos",
    features: ["BaseLine R$25", "Suporte 24h"],
  },
  {
    name: "BetMGM Pro",
    logo: mgmbetProLogo,
    commission: "R$80 de CPA",
    features: ["BaseLine R$25", "Pagamento Semanal", "Suporte 24h"],
  },
  {
    name: "SeuBet",
    logo: seubetLogo,
    commission: "60% de Rev Share",
    features: ["Pagamento Mensal"],
  },
];

interface PublicCasino {
  id: string;
  name: string;
  url: string | null;
  urlAfiliado: string | null;
  comissaoCpa: number;
  comissaoRevshare: number;
  description: string | null;
}

const casinoLogoMap: Record<string, string> = {
  brasilbet: brasilbetLogo,
  betsul: betsulLogo,
  multibet: multibetLogo,
  betmgm: mgmbetLogo,
  betmgmpro: mgmbetLogo,
  luvabet: luvabetLogo,
  bigbet: bigbetLogo,
  seubet: seubetLogo,
};

function commissionLabel(c: PublicCasino): string {
  if (c.comissaoCpa > 0) return `R$${Math.round(c.comissaoCpa)} de CPA`;
  if (c.comissaoRevshare > 0) return `${c.comissaoRevshare}% dos depósitos`;
  return "Comissão a combinar";
}

function logoForCasino(c: PublicCasino): string {
  const key = (c.id || c.name).toLowerCase();
  const assetLogo = casinoLogoMap[key];
  if (assetLogo) return assetLogo;
  return `https://placehold.co/200x80/1e293b/ffffff?text=${encodeURIComponent(c.name)}`;
}

const Plataformas = () => {
  const { toast } = useToast();
  const [casinos, setCasinos] = useState<PublicCasino[] | null>(null);

  async function solicitarContrato(platformName: string) {
    try {
      await apiPost<{ ok: true; id: string; status: string }>("/me/contracts", {
        platformName,
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

  const platforms = useMemo(() => {
    if (!casinos) return platformsFallback;
    return casinos.map((c) => ({
      name: c.name,
      logo: logoForCasino(c),
      commission: commissionLabel(c),
      features: [
        "Pagamento Semanal",
        ...(c.description ? [c.description] : []),
      ],
    }));
  }, [casinos]);

  return (
    <div className="animate-in fade-in duration-500">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
          <span className="text-foreground">Nossas </span>
          <span className="text-gradient-neon">Plataformas</span>
        </h1>
        <p className="text-muted-foreground">
          Trabalhe com as melhores casas de apostas e maximize seus ganhos
        </p>
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
        {platforms.map((platform, index) => (
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
              onClick={() => solicitarContrato(platform.name)}
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
