import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Menu, X } from "lucide-react";
import "@/Stilos/stilo.css";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border/50 py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/iAfiliado.png"
            alt="iAfiliado"
            className="h-14 md:h-16 w-auto transition-transform duration-300 hover:scale-105"
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/como-funciona"
            className="text-sm text-muted-foreground hover:texto-secundario transition-colors"
          >
            Como Funciona
          </Link>
          <Link
            to="/plataformas"
            className="text-sm text-muted-foreground hover:texto-secundario transition-colors"
          >
            Plataformas
          </Link>
          <Link
            to="/comissoes"
            className="text-sm text-muted-foreground hover:texto-secundario transition-colors"
          >
            Comissões
          </Link>
          <Link
            to="/suporte"
            className="text-sm text-muted-foreground hover:texto-secundario transition-colors"
          >
            Suporte
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Login
            </Button>
          </Link>
          <Link to="/cadastro">
            <Button className="btn-principal" size="sm">
              Cadastrar
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/98 backdrop-blur-lg border-b border-border/50 py-4">
          <div className="container mx-auto px-4 flex flex-col gap-4">
            <Link
              to="/como-funciona"
              className="text-foreground hover:texto-secundario transition-colors py-2"
            >
              Como Funciona
            </Link>
            <Link
              to="/plataformas"
              className="text-foreground hover:texto-secundario transition-colors py-2"
            >
              Plataformas
            </Link>
            <Link
              to="/comissoes"
              className="text-foreground hover:texto-secundario transition-colors py-2"
            >
              Comissões
            </Link>
            <Link
              to="/suporte"
              className="text-foreground hover:texto-secundario transition-colors py-2"
            >
              Suporte
            </Link>
            <div className="flex gap-4 pt-4 border-t border-border/50">
              <Link to="/login" className="flex-1">
                <Button variant="goldOutline" size="sm" className="w-full">
                  Login
                </Button>
              </Link>
              <Link to="/cadastro" className="flex-1">
                <Button className="w-full btn-principal" size="sm">
                  Cadastrar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
