import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import {
  Mail,
  MailOpen,
  Trash2,
  CheckSquare,
  Square,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiGet } from "@/lib/api-client";
import "@/Stilos/stilo.css";

interface Message {
  id: string;
  subject: string;
  preview: string;
  sender: string;
  date: string;
  status: "unread" | "read" | "replied";
  priority: "low" | "medium" | "high";
}

const SuporteMensagens = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "replied">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await apiGet<any[]>("/support/messages");
        const mappedMessages: Message[] = data.map((msg) => ({
          id: msg.id.toString(),
          subject: msg.subject,
          preview: msg.message,
          sender: msg.name,
          date: msg.created_at,
          status: msg.status || "unread",
          priority: msg.priority || "medium",
        }));
        setMessages(mappedMessages);
      } catch (error) {
        console.error("Erro ao buscar mensagens:", error);
      }
    };

    fetchMessages();
  }, []);

  const filteredMessages = messages.filter((msg) => {
    const matchesFilter = filter === "all" || msg.status === filter;
    const matchesSearch =
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.preview.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredMessages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMessages.map((m) => m.id));
    }
  };

  const markAsRead = () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Selecione mensagens",
        description: "Nenhuma mensagem selecionada.",
      });
      return;
    }
    setMessages((prev) =>
      prev.map((msg) =>
        selectedIds.includes(msg.id) ? { ...msg, status: "read" } : msg
      )
    );
    toast({
      title: "Marcadas como lidas",
      description: `${selectedIds.length} mensagem(ns) atualizada(s).`,
    });
    setSelectedIds([]);
  };

  const markAsUnread = () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Selecione mensagens",
        description: "Nenhuma mensagem selecionada.",
      });
      return;
    }
    setMessages((prev) =>
      prev.map((msg) =>
        selectedIds.includes(msg.id) ? { ...msg, status: "unread" } : msg
      )
    );
    toast({
      title: "Marcadas como não lidas",
      description: `${selectedIds.length} mensagem(ns) atualizada(s).`,
    });
    setSelectedIds([]);
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0) {
      toast({
        title: "Selecione mensagens",
        description: "Nenhuma mensagem selecionada.",
      });
      return;
    }
    setMessages((prev) => prev.filter((msg) => !selectedIds.includes(msg.id)));
    toast({
      title: "Mensagens removidas",
      description: `${selectedIds.length} mensagem(ns) excluída(s).`,
    });
    setSelectedIds([]);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/20 text-destructive border-destructive/30";
      case "medium":
        return "bg-secundario-suave texto-secundario borda-secundaria-suave";
      case "low":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unread":
        return <Mail className="w-4 h-4 texto-destaque" />;
      case "read":
        return <MailOpen className="w-4 h-4 text-muted-foreground" />;
      case "replied":
        return <CheckCircle className="w-4 h-4 texto-destaque" />;
      default:
        return null;
    }
  };

  const unreadCount = messages.filter((m) => m.status === "unread").length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--cor-secundaria-suave)] via-transparent to-transparent" />
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-secundario-suave texto-secundario text-sm font-semibold mb-4 uppercase tracking-wider">
                Central de Mensagens
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-bold">
                Suas{" "}
                <span className="texto-gradiente-secundario">Mensagens</span>
              </h1>
              <p className="text-muted-foreground mt-2">
                {unreadCount > 0
                  ? `${unreadCount} mensagem(ns) não lida(s)`
                  : "Todas as mensagens foram lidas"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-16 px-4">
        <div className="container mx-auto">
          {/* Toolbar */}
          <div className="bg-gradient-card rounded-2xl border border-border/50 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Search */}
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar mensagens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-muted border-border"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Button
                  className={
                    filter === "all" ? "btn-principal" : "btn-principal-outline"
                  }
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  Todas
                </Button>
                <Button
                  className={
                    filter === "unread"
                      ? "btn-principal"
                      : "btn-principal-outline"
                  }
                  size="sm"
                  onClick={() => setFilter("unread")}
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Não lidas
                </Button>
                <Button
                  className={
                    filter === "read"
                      ? "btn-principal"
                      : "btn-principal-outline"
                  }
                  size="sm"
                  onClick={() => setFilter("read")}
                >
                  <MailOpen className="w-4 h-4 mr-1" />
                  Lidas
                </Button>
                <Button
                  className={
                    filter === "replied"
                      ? "btn-principal"
                      : "btn-principal-outline"
                  }
                  size="sm"
                  onClick={() => setFilter("replied")}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Respondidas
                </Button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="text-muted-foreground hover:text-foreground"
              >
                {selectedIds.length === filteredMessages.length &&
                filteredMessages.length > 0 ? (
                  <CheckSquare className="w-4 h-4 mr-2" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
                {selectedIds.length === filteredMessages.length &&
                filteredMessages.length > 0
                  ? "Desmarcar todas"
                  : "Selecionar todas"}
              </Button>

              {selectedIds.length > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} selecionada(s)
                  </span>
                  <div className="h-4 w-px bg-border" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAsRead}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <MailOpen className="w-4 h-4 mr-2" />
                    Marcar como lida
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAsUnread}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Marcar como não lida
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteSelected}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Messages List */}
          <div className="space-y-3">
            {filteredMessages.length === 0 ? (
              <div className="bg-gradient-card rounded-2xl border border-border/50 p-12 text-center">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-display font-bold text-foreground mb-2">
                  Nenhuma mensagem encontrada
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Tente ajustar sua busca"
                    : "Você não tem mensagens nesta categoria"}
                </p>
              </div>
            ) : (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "bg-gradient-card rounded-xl border border-border/50 p-4 transition-all duration-200 hover:border-primary/30 cursor-pointer",
                    message.status === "unread" &&
                      "border-l-4 border-l-[color:var(--cor-principal)] bg-principal-suave",
                    selectedIds.includes(message.id) &&
                      "ring-2 ring-[color:var(--cor-principal)]/50 bg-principal-suave"
                  )}
                  onClick={() => toggleSelect(message.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <Checkbox
                        checked={selectedIds.includes(message.id)}
                        onCheckedChange={() => toggleSelect(message.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* Status Icon */}
                    <div className="pt-1">{getStatusIcon(message.status)}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                        <h4
                          className={cn(
                            "font-display text-foreground truncate",
                            message.status === "unread"
                              ? "font-bold"
                              : "font-medium"
                          )}
                        >
                          SUP-{message.id} - {message.subject}
                        </h4>
                        <Badge
                          className={cn(
                            "w-fit text-xs",
                            getPriorityColor(message.priority)
                          )}
                        >
                          {message.priority === "high" && (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          )}
                          {message.priority === "high"
                            ? "Alta"
                            : message.priority === "medium"
                            ? "Média"
                            : message.priority === "low"
                            ? "Baixa"
                            : message.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mb-2">
                        {message.preview}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/70">
                          {message.sender}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(message.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Stats */}
          {messages.length > 0 && (
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center">
                <p className="text-2xl font-display font-bold text-foreground">
                  {messages.length}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center">
                <p className="text-2xl font-display font-bold texto-destaque">
                  {messages.filter((m) => m.status === "unread").length}
                </p>
                <p className="text-sm text-muted-foreground">Não lidas</p>
              </div>
              <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center">
                <p className="text-2xl font-display font-bold text-foreground">
                  {messages.filter((m) => m.status === "read").length}
                </p>
                <p className="text-sm text-muted-foreground">Lidas</p>
              </div>
              <div className="bg-gradient-card rounded-xl border border-border/50 p-4 text-center">
                <p className="text-2xl font-display font-bold texto-destaque">
                  {messages.filter((m) => m.status === "replied").length}
                </p>
                <p className="text-sm text-muted-foreground">Respondidas</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SuporteMensagens;
