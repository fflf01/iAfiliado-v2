import { Link } from "react-router-dom";
import { ExternalLink, Shield, Zap, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const platforms = [
  {
    name: "BrasilBet",
    logo: "https://placehold.co/200x80/1e293b/ffffff?text=BrasilBet",
    commission: "11% dos depósitos",
    features: ["Pagamento Semanal", "Saque rápido", "Suporte 24h"],
  },
  {
    name: "BetMGM",
    logo: "https://placehold.co/200x80/1e293b/ffffff?text=BetMGM",
    commission: "R$100 de CPA",
    features: ["BaseLine R$25", "Pagamento Mensal", "Suporte 24h"],
  },
  {
    name: "LuvaBet",
    logo: "https://placehold.co/200x80/1e293b/ffffff?text=LuvaBet",
    commission: "11% dos depósitos",
    features: ["Pagamento Semanal", "Saque rápido", "Suporte 24h"],
  },
  {
    name: "BigBet",
    logo: "https://placehold.co/200x80/1e293b/ffffff?text=BigBet",
    commission: "10% dos Depósitos",
    features: ["BaseLine R$25", "Suporte 24h"],
  },
  {
    name: "BetMGM Pro",
    logo: "https://placehold.co/200x80/1e293b/ffffff?text=BetMGM+Pro",
    commission: "R$80 de CPA",
    features: ["BaseLine R$25", "Pagamento Semanal", "Suporte 24h"],
  },
  {
    name: "SeuBet",
    logo: "https://placehold.co/200x80/1e293b/ffffff?text=SeuBet",
    commission: "60% de Rev Share",
    features: ["Pagamento Mensal"],
  },
];

const Plataformas = () => {
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
              variant="neonOutline"
              className="w-full h-10 text-xs font-semibold uppercase tracking-wide"
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
