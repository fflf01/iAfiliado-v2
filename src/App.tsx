/**
 * Raiz da aplicação: providers (QueryClient, Tooltip, Toaster, Sonner) e roteamento (React Router).
 * Rotas customizadas devem ser declaradas acima da rota catch-all "*" para evitar 404.
 */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import ComoFunciona from "./pages/ComoFunciona";
import Plataformas from "./pages/Plataformas";
import Suporte from "./pages/Suporte";
import Comissoes from "./pages/Comissoes";
import SuporteCliente from "./pages/SuporteCliente";
import SuporteAdmin from "./pages/suporteadmin";
import LinkPage from "./pages/link";
import CarteiraPage from "./pages/carteira";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/login" element={<Login />} />
          {/* As rotas do dashboard agora são aninhadas para melhor organização e fluxo */}
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Navigate to="links" replace />} />
            <Route path="links" element={<LinkPage />} />
            <Route path="carteira" element={<CarteiraPage />} />
            {/* A rota de plataformas agora também fica dentro do layout do dashboard */}
            <Route path="plataformas" element={<Plataformas />} />
          </Route>
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="/plataformas" element={<Plataformas />} />
          <Route path="/suporte" element={<Suporte />} />
          <Route path="/comissoes" element={<Comissoes />} />
          <Route path="/suporte-cliente" element={<SuporteCliente />} />
          <Route path="/suporteadmin" element={<SuporteAdmin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
