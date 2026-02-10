import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  CheckCircle,
  Users,
  Link2,
  DollarSign,
  ArrowRight,
  Megaphone,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import "@/Stilos/stilo.css";

const steps = [
  {
    number: "01",
    icon: Users,
    title: "Cadastre-se Gratuitamente",
    description:
      "Crie sua conta em menos de 2 minutos. Sem taxas, sem burocracia. Apenas preencha seus dados básicos e comece.",
  },
  {
    number: "02",
    icon: Megaphone,
    title: "Escolha a plataforma para divulgar",
    description: "Escolha as ofertas que mais se adequam a sua operação.",
  },
  {
    number: "03",
    icon: Clock,
    title: "Aguarde a aprovação da plataforma",
    description: "A plataforma fará uma analise antes da aprovação.",
  },
  {
    number: "04",
    icon: Link2,
    title: "Receba seus Links",
    description:
      "Após aprovação, você terá acesso a links exclusivos de afiliado para todas as plataformas parceiras.",
  },
  {
    number: "05",
    icon: CheckCircle,
    title: "Divulgue e Converta",
    description:
      "Compartilhe seus links nas redes sociais, sites, canais ou grupos. Cada pessoa que se cadastrar através do seu link será rastreada.",
  },
  {
    number: "06",
    icon: DollarSign,
    title: "Receba Suas Comissões",
    description:
      "Ganha comissões recorrentes sobre as apostas dos seus indicados. Pagamentos semanais via PIX, ou cripto.",
  },
];

const requirements = [
  "Ter mais de 18 anos",
  "Possuir documento de identificação válido",
  "Conta bancária ou carteira cripto para recebimento",
  "Compromisso com práticas éticas de divulgação",
];

const ComoFunciona = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--cor-principal-suave)] via-transparent to-transparent" />
        <div className="container mx-auto relative z-10 text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-principal-suave texto-destaque text-sm font-semibold mb-4 uppercase tracking-wider">
            Passo a Passo
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Como <span className="texto-gradiente-destaque">Funciona</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Entenda como você pode começar a ganhar dinheiro como afiliado em
            apenas 4 passos simples
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex flex-col md:flex-row items-start gap-6 bg-gradient-card rounded-2xl p-8 border border-border/50 card-hover"
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-gold flex items-center justify-center">
                    <span className="text-2xl font-display font-bold text-primary-foreground">
                      {step.number}
                    </span>
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-3">
                    <step.icon className="w-6 h-6 texto-destaque" />
                    <h3 className="text-2xl font-display font-bold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:flex items-center"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16 px-4 bg-casino-surface/30">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-center mb-8">
              <span className="texto-gradiente-secundario">Requisitos</span>{" "}
              para se tornar um{" "}
              <span className="texto-gradiente-secundario">iAfiliado</span>{" "}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requirements.map((req, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-gradient-card rounded-xl p-4 border border-border/50"
                >
                  <CheckCircle className="w-5 h-5 texto-destaque flex-shrink-0" />
                  <span className="text-foreground">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
            Pronto para{" "}
            <span className="texto-gradiente-destaque">Começar</span>?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Junte-se a milhares de afiliados que já estão lucrando com nosso
            programa
          </p>
          <Link to="/cadastro">
            <Button className="btn-principal" size="xl">
              Criar Minha Conta Grátis
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ComoFunciona;
