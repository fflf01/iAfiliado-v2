import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import "@/Stilos/stilo.scss";
import heroBg from "@/assets/hero-casino-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBg})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-transparent to-background/90" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-principal-suave rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-secundario-suave rounded-full blur-[150px] animate-pulse" />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secundario-suave border borda-secundaria-suave mb-8 animate-float">
            <span className="w-2 h-2 rounded-full bg-principal animate-pulse" />
            <span className="texto-secundario text-sm font-semibold uppercase tracking-wider">
              Programa de Afiliados #1 do Brasil
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black mb-6 leading-tight">
            <span className="text-foreground">Ganhe </span>
            <span className="texto-gradiente-secundario">Dinheiro</span>
            <br />
            <span className="text-foreground">com </span>
            <span className="texto-gradiente-destaque">iGaming</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Torne-se um afiliado de sucesso e ganhe comissões de até{" "}
            <span className="texto-secundario font-semibold">50%</span>{" "}
            indicando as melhores plataformas de casino online do mercado.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/login">
              <Button size="xl" className="btn-principal group h-auto py-6">
                Começar Agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/como-funciona">
              <Button variant="goldOutline" size="lg" className="gap-2">
                <Play className="w-4 h-4" />
                Ver Como Funciona
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold texto-gradiente-secundario mb-1">
                R$2M+
              </div>
              <div className="text-sm text-muted-foreground">
                Pagos em Comissões
              </div>
            </div>
            <div className="text-center border-x border-border/50">
              <div className="text-3xl md:text-4xl font-display font-bold texto-gradiente-destaque mb-1">
                5.000+
              </div>
              <div className="text-sm text-muted-foreground">
                Afiliados Ativos
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold texto-gradiente-secundario mb-1">
                50%
              </div>
              <div className="text-sm text-muted-foreground">
                Comissão Máxima
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 borda-secundaria-suave flex items-start justify-center pt-2">
          <div className="w-1.5 h-3 bg-secundario rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
