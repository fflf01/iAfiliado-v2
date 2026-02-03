import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "@/Stilos/stilo.scss";

const ForgotPassword = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulating API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "E-mail enviado!",
      description: "Verifique sua caixa de entrada para redefinir sua senha.",
    });

    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Voltar ao login
        </Link>

        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-3">
                <span className="text-foreground">Esqueceu sua </span>
                <span className="texto-gradiente-secundario">senha?</span>
              </h1>
              <p className="text-muted-foreground">
                Informe seu e-mail e enviaremos um link para redefinir sua
                senha.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-11 h-12 bg-card border-border focus-borda-principal"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-12 mt-2 btn-principal"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-principal-suave flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 texto-destaque" />
            </div>
            <h1 className="text-3xl font-display font-bold mb-3 text-foreground">
              E-mail enviado!
            </h1>
            <p className="text-muted-foreground mb-8">
              Enviamos um link de recuperação para{" "}
              <span className="text-foreground font-medium">{email}</span>.
              Verifique sua caixa de entrada.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12"
              onClick={() => setIsSubmitted(false)}
            >
              Enviar novamente
            </Button>
          </div>
        )}

        {/* Login Link */}
        <p className="text-center text-muted-foreground mt-6">
          Lembrou a senha?{" "}
          <Link
            to="/login"
            className="texto-secundario hover:text-yellow-600 font-medium transition-colors"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
