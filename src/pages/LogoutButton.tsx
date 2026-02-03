import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const LogoutButton = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    // Limpa as credenciais do armazenamento local e sessão
    // Isso garante que o usuário seja desconectado
    localStorage.clear();
    sessionStorage.clear();

    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta com sucesso.",
    });

    navigate("/login");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
    >
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Sair</span>
    </Button>
  );
};

export default LogoutButton;
