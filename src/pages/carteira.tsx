import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Crown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  Building2,
  QrCode,
  ArrowLeft,
  Download,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  type: "entrada" | "saida";
  amount: number;
  description: string;
  status: "concluido" | "pendente" | "cancelado";
  date: string;
  method: string;
}

const Carteira = () => {
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("pix");

  const balance = 4850.0;
  const pendingBalance = 1680.0;
  const totalWithdrawn = 12450.0;

  const transactions: Transaction[] = [
    {
      id: "1",
      type: "entrada",
      amount: 520.0,
      description: "Comissão Bet365 - Janeiro",
      status: "concluido",
      date: "28/01/2024",
      method: "Sistema",
    },
    {
      id: "2",
      type: "saida",
      amount: 1250.0,
      description: "Saque via PIX",
      status: "concluido",
      date: "25/01/2024",
      method: "PIX",
    },
    {
      id: "3",
      type: "entrada",
      amount: 380.0,
      description: "Comissão Betano - Janeiro",
      status: "concluido",
      date: "22/01/2024",
      method: "Sistema",
    },
    {
      id: "4",
      type: "saida",
      amount: 500.0,
      description: "Saque via Transferência",
      status: "pendente",
      date: "20/01/2024",
      method: "Transferência",
    },
    {
      id: "5",
      type: "entrada",
      amount: 890.0,
      description: "Bônus de Performance",
      status: "concluido",
      date: "18/01/2024",
      method: "Sistema",
    },
    {
      id: "6",
      type: "saida",
      amount: 200.0,
      description: "Saque via PIX",
      status: "cancelado",
      date: "15/01/2024",
      method: "PIX",
    },
  ];

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido para saque.",
        variant: "destructive",
      });
      return;
    }
    if (amount > balance) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não possui saldo suficiente para este saque.",
        variant: "destructive",
      });
      return;
    }
    if (amount < 50) {
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para saque é R$ 50,00.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Saque solicitado!",
      description: `Saque de R$ ${amount.toFixed(
        2
      )} via ${selectedMethod.toUpperCase()} foi solicitado.`,
    });
    setWithdrawAmount("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido":
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case "pendente":
        return <Clock className="w-4 h-4 text-secondary" />;
      case "cancelado":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "concluido":
        return "Concluído";
      case "pendente":
        return "Pendente";
      case "cancelado":
        return "Cancelado";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Crown className="w-8 h-8 text-primary" />
            <span className="text-xl font-display font-bold text-gradient-neon">
              iAfiliado
            </span>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
            <span className="text-foreground">Minha </span>
            <span className="text-gradient-neon">Carteira</span>
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus ganhos e solicite saques
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20 text-primary">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  Saldo Disponível
                </p>
                <p className="text-3xl font-display font-bold text-foreground">
                  R${" "}
                  {balance.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-card/80 border-border/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Saldo Pendente</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  R${" "}
                  {pendingBalance.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-card/80 border-border/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Total Sacado</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  R${" "}
                  {totalWithdrawn.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Withdraw Section */}
          <Card className="bg-card/80 border-border/50 p-6">
            <h2 className="text-xl font-display font-bold text-foreground mb-6">
              Solicitar Saque
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Valor do Saque
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    R$
                  </span>
                  <Input
                    type="number"
                    placeholder="0,00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="pl-10 bg-muted/30 border-border/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mínimo: R$ 50,00
                </p>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Método de Saque
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedMethod("pix")}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                      selectedMethod === "pix"
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-primary/30"
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs">PIX</span>
                  </button>
                  <button
                    onClick={() => setSelectedMethod("ted")}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                      selectedMethod === "ted"
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-primary/30"
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs">TED</span>
                  </button>
                  <button
                    onClick={() => setSelectedMethod("card")}
                    className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                      selectedMethod === "card"
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-primary/30"
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="text-xs">Cartão</span>
                  </button>
                </div>
              </div>

              <Button
                variant="neon"
                className="w-full"
                onClick={handleWithdraw}
              >
                Solicitar Saque
              </Button>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="font-medium text-foreground mb-2 text-sm">
                  Informações de Saque
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• PIX: Processamento em até 1 hora</li>
                  <li>• TED: Processamento em até 24 horas</li>
                  <li>• Cartão: Processamento em até 3 dias úteis</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Transaction History */}
          <Card className="bg-card/80 border-border/50 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">
                  Histórico de Transações
                </h2>
                <p className="text-muted-foreground text-sm">
                  Suas últimas movimentações
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>

            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        transaction.type === "entrada"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {transaction.type === "entrada" ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.date} • {transaction.method}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={`font-display font-bold ${
                          transaction.type === "entrada"
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {transaction.type === "entrada" ? "+" : "-"} R${" "}
                        {transaction.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      {getStatusIcon(transaction.status)}
                      <span
                        className={`text-xs font-medium ${
                          transaction.status === "concluido"
                            ? "text-primary"
                            : transaction.status === "pendente"
                            ? "text-secondary"
                            : "text-destructive"
                        }`}
                      >
                        {getStatusText(transaction.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Carteira;
