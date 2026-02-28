import { Button } from "@/components/ui/button";
import { Menu, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminTopBar(props: {
  isMobile: boolean;
  onOpenSidebar: () => void;
}) {
  return (
    <>
      {/* Desktop: header bar — separação clara entre navegação e conteúdo */}
      <header className="hidden lg:flex items-center justify-end shrink-0 px-6 py-5 border-b border-border/50 bg-muted/20">
        <Link to="/dashboard" className="text-foreground">
          <Button
            variant="outline"
            size="sm"
            className="font-display tracking-wide uppercase text-xs gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </header>

      {/* Top bar (mobile) */}
      {props.isMobile && (
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border/50 px-4 py-3 flex items-center justify-between lg:hidden">
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
