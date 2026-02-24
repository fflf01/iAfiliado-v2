import { Button } from "@/components/ui/button";
import { Menu, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminTopBar(props: {
  isMobile: boolean;
  onOpenSidebar: () => void;
}) {
  return (
    <>
      {/* Desktop fixed button */}
      <div className="fixed top-4 right-4 z-40 hidden lg:block">
        <Link to="/dashboard" className="text-foreground">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Button>
        </Link>
      </div>

      {/* Top bar (mobile) */}
      {props.isMobile && (
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-sm border-b border-border/50 px-4 py-3 flex items-center justify-between lg:hidden">
          <button onClick={props.onOpenSidebar} className="text-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <img src="/iAfiliado.png" alt="iAfiliado" className="h-7 w-auto" />
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

