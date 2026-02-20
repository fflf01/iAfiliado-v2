import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Gift, CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import "@/Stilos/stilo.css";

const CTASection = () => {
  return (
    <section className="py-14 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-casino-surface/50 to-background" />

      {/* Decorative elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-principal-suave rounded-full blur-[200px]" />
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-secundario-suave rounded-full blur-[150px]" />

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-gold mb-6 shadow-gold animate-float">
            <Gift className="w-7 h-7 text-primary-foreground" />
          </div>
          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-display font-black mb-4">
            Pronto para{" "}
            <span className="texto-gradiente-secundario">Lucrar</span>?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Cadastre-se agora e receba acesso exclusivo ao nosso programa de
            afiliados.
            <span className="texto-secundario font-semibold">
              {" "}
              Bonus de ***
            </span>{" "}
            para os primeiros 100 afiliados!
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-secundario/70 text-secundario transition-colors hover:bg-secundario/10"
                    aria-label="Regulamento da promocao"
                  >
                    <CircleHelp className="h-7 w-7" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-left leading-relaxed">
                  <span className="font-semibold">(Regulamento)</span> trazer pelo menos
                  100 CPAs / trazer pelo menos 20k em depositos.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to="/cadastro">
              <Button size="xl" className="btn-principal group">
                Cadastrar Grátis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Link to="/suporte">
              <Button variant="goldOutline" size="lg">
                Falar com Suporte
              </Button>
            </Link>
          </div>
          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-principal" />
              Cadastro 100% Gratuito
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secundario" />
              Sem Taxas Escondidas
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-principal" />
              Suporte 24/7
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
