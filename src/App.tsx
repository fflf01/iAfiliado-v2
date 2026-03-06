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
import Admin from "./pages/Admin/Admin";

const queryClient = new QueryClient();

const publicRoutes = [
  { path: "/", element: <Index /> },
  { path: "/cadastro", element: <Register /> },
  { path: "/login", element: <Login /> },
  { path: "/esqueci-senha", element: <ForgotPassword /> },
  { path: "/como-funciona", element: <ComoFunciona /> },
  { path: "/plataformas", element: <Plataformas /> },
  { path: "/suporte", element: <Suporte /> },
  { path: "/comissoes", element: <Comissoes /> },
];

const protectedRoutes = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/dashboard/links", element: <Dashboard /> },
  { path: "/dashboard/carteira", element: <Dashboard /> },
  { path: "/dashboard/plataformas", element: <Dashboard /> },
  { path: "/dashboard/entradas", element: <Dashboard /> },
  { path: "/dashboard/contas-manager", element: <Dashboard /> },
  { path: "/entradas", element: <Dashboard /> },
  { path: "/suporte-cliente", element: <SuporteCliente /> },
];

const adminRoutes = [
  { path: "/admin", element: <Admin /> },
  { path: "/suporteadmin", element: <SuporteAdmin /> },
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Rotas públicas */}
          {publicRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={route.element}
            />
          ))}

          {/* Rotas protegidas (requer autenticação) */}
          {protectedRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<ProtectedRoute>{route.element}</ProtectedRoute>}
            />
          ))}

          {/* Rotas de admin (requer autenticação + acesso admin: admin_ceo ou support) */}
          {adminRoutes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <ProtectedRoute requireAdminAccess>
                  {route.element}
                </ProtectedRoute>
              }
            />
          ))}

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
