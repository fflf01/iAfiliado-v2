import { Sparkles, TrendingUp, Shield, Zap } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Comissões Altas",
    description: "Ganhe até 50% de comissão em cada jogador indicado. Pagamentos semanais garantidos.",
  },
  {
    icon: Shield,
    title: "Plataformas Confiáveis",
    description: "Trabalhamos apenas com casinos licenciados e regulamentados internacionalmente.",
  },
  {
    icon: Zap,
    title: "Pagamentos Rápidos",
    description: "Receba seus ganhos via PIX, criptomoedas ou transferência bancária em até 24h.",
  },
  {
    icon: Sparkles,
    title: "Suporte VIP",
    description: "Equipe dedicada para ajudar você a maximizar seus resultados 24/7.",
  },
];

const BenefitsSection = () => {
  return (
    <section className="py-24 px-4 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-casino-surface/30 to-background" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4 uppercase tracking-wider">
            Por que nos escolher
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            <span className="text-gradient-gold">Vantagens</span> Exclusivas
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Descubra por que somos a escolha número 1 para afiliados de casino no Brasil
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="bg-gradient-card rounded-2xl p-8 border border-border/50 card-hover group"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-gold flex items-center justify-center mb-6 group-hover:shadow-gold transition-shadow duration-300">
                <benefit.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-3">
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
