import { Button } from "@/components/ui/button";
import { Menu, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminTopBar(props: {
  isMobile: boolean;
  onOpenSidebar: () => void;
}) {
  return (
    <>
      {/* Desktop: mesmo layout do SuporteAdmin — logo + Voltar */}
      <header className="hidden lg:block border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50 shrink-0">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/iAfiliado.png"
              alt="iAfiliado"
              className="h-24 md:h-32 w-auto transition-transform duration-300 hover:scale-105"
            />
          </Link>
          <Link to="/dashboard" className="text-foreground">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Top bar (mobile) — mesmo padrão: menu, logo, Voltar */}
      {props.isMobile && (
        <header className="sticky top-0 z-30 bg-card/50 backdrop-blur-sm border-b border-border/50 px-4 py-3 flex items-center justify-between lg:hidden">
          <button onClick={props.onOpenSidebar} className="text-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <img src="/iAfiliado.png" alt="iAfiliado" className="h-11 w-auto" />
          <Link to="/dashboard" className="text-foreground">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
        </header>
      )}
    </>
  );
}
