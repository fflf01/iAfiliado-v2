import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, User, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api-client";
import { setAuth, clearAuth } from "@/lib/auth";
import type { AuthResponse } from "@/types";
import "@/Stilos/stilo.css";

const Login = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ login: "", password: "" });

  useEffect(() => {
    clearAuth();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await apiPost<AuthResponse>("/login", {
        login: formData.login,
        password: formData.password,
      });

      setAuth(data.token, data.user);
      navigate("/dashboard");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro inesperado",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar ao início
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
            <span className="text-foreground">Acesse sua </span>
            <span className="texto-gradiente-secundario">Conta</span>
          </h1>
          <p className="text-muted-foreground">
            Entre com suas credenciais para continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login" className="text-foreground">
              Login ou E-mail
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="login"
                name="login"
                type="text"
                placeholder="Seu login ou e-mail"
                value={formData.login}
                onChange={handleChange}
                required
                className="pl-11 h-12 bg-card border-border focus-borda-principal"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={formData.password}
                onChange={handleChange}
                required
                className="pl-11 pr-11 h-12 bg-card border-border focus-borda-principal"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-12 mt-2 btn-principal"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                Entrando...
              </div>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <p className="text-center text-muted-foreground mt-6 text-2xl">
          Não tem uma conta?{" "}
          <Link
            to="/cadastro"
            className="texto-secundario hover:text-yellow-600 font-medium transition-colors"
          >
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
