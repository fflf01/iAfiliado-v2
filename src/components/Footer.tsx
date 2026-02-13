import { Link } from "react-router-dom";
import { Crown, Mail, MessageCircle } from "lucide-react";
import "@/Stilos/stilo.css";

const Footer = () => {
  return (
    <footer className="py-10 px-4 border-t border-border/30 bg-casino-dark">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl font-display font-bold texto-gradiente-secundario">
                <img src="/iAfiliado.png" alt="iAfiliado" className="h-20" />
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              O programa de afiliados mais lucrativo do Brasil. Transforme sua
              audiência em renda passiva.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover-bg-principal transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center hover-bg-principal transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-bold text-foreground mb-4">
              Programa
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <Link
                  to="/como-funciona"
                  className="hover:texto-secundario transition-colors"
                >
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link
                  to="/comissoes"
                  className="hover:texto-secundario transition-colors"
                >
                  Comissões
                </Link>
              </li>
              <li>
                <Link
                  to="/plataformas"
                  className="hover:texto-secundario transition-colors"
                >
                  Plataformas Parceiras
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:texto-secundario transition-colors"
                >
                  Materiais
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground mb-4">
              Plataformas
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href="#"
                  className="hover:texto-secundario transition-colors"
                >
                  Bet365
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:texto-secundario transition-colors"
                >
                  Betano
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:texto-secundario transition-colors"
                >
                  Stake
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:texto-secundario transition-colors"
                >
                  1xBet
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-foreground mb-4">
              Suporte
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href="#"
                  className="hover:texto-secundario transition-colors"
                >
                  Central de Ajuda
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:texto-secundario transition-colors"
                >
                  Contato
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:texto-secundario transition-colors"
                >
                  Termos de Uso
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:texto-secundario transition-colors"
                >
                  Privacidade
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <p>© 2026 iAfiliado. Todos os direitos reservados.</p>
            <a
              href="https://github.com/fflf01"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:texto-secundario transition-colors"
            >
              GitHub
            </a>
          </div>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-principal animate-pulse" />
            Jogue com responsabilidade. +18
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
