import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { TrendingUp, Wallet, Clock, CheckCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import "@/Stilos/stilo.css";

const benefits = [
  {
    icon: TrendingUp,
    title: "Comissão Recorrente",
    description: "Ganhe enquanto seus indicados jogarem.",
  },
  {
    icon: Clock,
    title: "Pagamentos Semanais",
    description: "Receba suas comissões toda semana, sem atrasos.",
  },
  {
    icon: Wallet,
    title: "Sem Valor Mínimo Alto",
    description: "Saque a partir de R$ 50 via PIX instantâneo.",
  },
  {
    icon: Zap,
    title: "Dashboard em Tempo Real",
    description: "Acompanhe seus ganhos e conversões ao vivo.",
  },
];

const Comissoes = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--cor-principal-suave)] via-transparent to-transparent" />
        <div className="container mx-auto relative z-10 text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-principal-suave texto-destaque text-sm font-semibold mb-4 uppercase tracking-wider">
            Ganhos Transparentes
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Estrutura de{" "}
            <span className="texto-gradiente-destaque">Comissões</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Quanto mais você indica, maior sua porcentagem. Comissões justas e
            pagamentos garantidos.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-casino-surface/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Por que Nosso{" "}
            <span className="texto-gradiente-secundario">Programa</span>?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-gradient-card rounded-2xl p-6 border border-border/50 card-hover text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-gold flex items-center justify-center mb-4">
                  <benefit.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-display font-bold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Métodos de{" "}
            <span className="texto-gradiente-destaque">Pagamento</span>
          </h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-card rounded-2xl border border-border/50 p-6 md:p-8 text-center">
              <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-4">
                Nossos metodos de pagamento
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Nossos planos de pagamentos dependem do acordo com a plataforma
                e da deal escolhida.
              </p>
              <p className="texto-secundario font-semibold">
                Em geral, nossos metodos de pagamentos são PIX e Crypto.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-casino-surface/30">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-display font-bold text-center mb-12">
            Perguntas{" "}
            <span className="texto-gradiente-secundario">Frequentes</span>
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Quando recebo minhas comissões?",
                a: "Os pagamentos são processados semanalmente, toda segunda-feira. Você pode acompanhar seus ganhos em tempo real no dashboard.",
              },
              {
                q: "Existe limite de ganhos?",
                a: "Não! Não há limite para quanto você pode ganhar. Quanto mais jogadores ativos você indicar, mais você ganha.",
              },
              {
                q: "Como funciona a comissão recorrente?",
                a: "Você recebe uma porcentagem sobre todas as apostas dos seus indicados, pelo tempo que eles permanecerem ativos na plataforma.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-gradient-card rounded-xl p-6 border border-border/50"
              >
                <h4 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 texto-destaque" />
                  {faq.q}
                </h4>
                <p className="text-muted-foreground pl-7">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
            Comece a{" "}
            <span className="texto-gradiente-destaque">Ganhar Hoje</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Cadastre-se gratuitamente e comece a receber comissões ainda esta
            semana
          </p>
          <Link to="/cadastro">
            <Button className="btn-principal" size="xl">
              Quero Me Cadastrar
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Comissoes;
