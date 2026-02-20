import { Sparkles, TrendingUp, Shield, Zap } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Comissões Agressivas",
    description:
      "Ganhe até 50% de comissão em cada jogador indicado. Pagamentos semanais garantidos.",
  },
  {
    icon: Shield,
    title: "Plataformas Regulamentadas e 100% confiáveis",
    description:
      "Trabalhamos apenas com casinos licenciados e regulamentados internacionalmente.",
  },
  {
    icon: Zap,
    title: "Pagamentos Rápidos",
    description: "Pagamentos feitos em até 24h dependendo do acordo.",
  },
  {
    icon: Sparkles,
    title: "Suporte VIP",
    description:
      "Equipe dedicada para ajudar você a maximizar seus resultados 24/7.",
  },
];

const BenefitsSection = () => {
  return (
    <section className="py-14 px-4 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-casino-surface/30 to-background" />

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-10">
          <span className="inline-block px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-3 uppercase tracking-wider">
            Por que nos escolher
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            <span className="text-gradient-gold">Vantagens</span> Exclusivas
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Descubra por que somos a escolha número 1 para afiliados de casino
            no Brasil
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-gradient-card rounded-2xl p-6 border border-border/50 card-hover group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center mb-4 group-hover:shadow-gold transition-shadow duration-300">
                <benefit.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
