/**
 * Raiz da aplicação: providers (QueryClient, Tooltip, Toaster, Sonner) e roteamento (React Router).
 * Rotas customizadas devem ser declaradas acima da rota catch-all "*" para evitar 404.
 */
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
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
import SuporteAdmin from "./pages/SuporteAdmin";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<ForgotPassword />} />
          <Route path="/como-funciona" element={<ComoFunciona />} />
          <Route path="/plataformas" element={<Plataformas />} />
          <Route path="/suporte" element={<Suporte />} />
          <Route path="/comissoes" element={<Comissoes />} />

          {/* Rotas protegidas (requer autenticação) */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/links" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/carteira" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/plataformas" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/entradas" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/entradas" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/suporte-cliente" element={<ProtectedRoute><SuporteCliente /></ProtectedRoute>} />

          {/* Rotas de admin (requer autenticação + admin) */}
          <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
          <Route path="/suporteadmin" element={<ProtectedRoute requireAdmin><SuporteAdmin /></ProtectedRoute>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
