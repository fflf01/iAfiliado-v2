import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Bot,
  Clock,
  CheckCheck,
  Paperclip,
  Smile,
  Phone,
  Video,
  MoreVertical,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPostForm, API_BASE_URL } from "@/lib/api-client";
import { getUser } from "@/lib/auth";
import { getStatusColor, getStatusLabel, type ChatMessage } from "@/lib/support-utils";
import { formatTime } from "@/lib/format";
import { useFileUpload } from "@/hooks/useFileUpload";

interface TicketView {
  id: string;
  subject: string;
  status: "aberto" | "em_andamento" | "resolvido";
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

const SuporteCliente = () => {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const { attachments, handleFileChange, removeFile, clearFiles } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tickets, setTickets] = useState<TicketView[]>([]);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  // Busca tickets do backend ao carregar
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await apiGet<any[]>("/support/my-messages");

        const mappedTickets: TicketView[] = data.map((item) => ({
          id: item.id.toString(),
          subject: item.subject || "Sem assunto",
          status: item.status || "aberto",
          lastMessage: item.message,
          updatedAt: new Date(item.created_at).toLocaleDateString("pt-BR"),
          unreadCount: 0,
        }));

        setTickets(mappedTickets);

        const initialMessages: Record<string, ChatMessage[]> = {};
        data.forEach((item) => {
          initialMessages[item.id.toString()] = [
            {
              id: `msg-${item.id}`,
              content: item.message,
              sender: "user",
              timestamp: formatTime(item.created_at),
              read: true,
              attachments: item.attachments?.map((a: any) => a.filename),
            },
          ];
        });
        setMessages(initialMessages);
      } catch (error) {
        console.error("Erro ao buscar tickets:", error);
      }
    };

    fetchTickets();
  }, []);

  // Busca respostas quando um ticket e selecionado
  useEffect(() => {
    if (!selectedTicket) return;

    const fetchReplies = async () => {
      try {
        const replies = await apiGet<any[]>(`/support/ticket/${selectedTicket}/replies`);

        const mappedReplies: ChatMessage[] = replies.map((r) => ({
          id: `reply-${r.id}`,
          content: r.message,
          sender: r.sender_type,
          timestamp: formatTime(r.created_at),
          read: true,
          attachments: r.attachments?.map((a: any) => a.filename),
        }));

        setMessages((prev) => {
          const currentMessages = prev[selectedTicket] || [];
          const initialMsg = currentMessages.length > 0 ? currentMessages[0] : null;
          return {
            ...prev,
            [selectedTicket]: initialMsg ? [initialMsg, ...mappedReplies] : mappedReplies,
          };
        });
      } catch (error) {
        console.error("Erro ao buscar respostas:", error);
      }
    };

    fetchReplies();
    const intervalId = setInterval(fetchReplies, 3000);
    return () => clearInterval(intervalId);
  }, [selectedTicket]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedTicket) return;

    const formData = new FormData();
    formData.append("message", newMessage);
    attachments.forEach((file) => formData.append("attachments", file));

    try {
      const reply = await apiPostForm<any>(`/support/ticket/${selectedTicket}/reply`, formData);

      const newMsg: ChatMessage = {
        id: `reply-${reply.id}`,
        content: reply.message,
        sender: "user",
        timestamp: formatTime(new Date().toISOString()),
        read: true,
        attachments: reply.attachments?.map((a: any) => a.filename),
      };

      setMessages((prev) => ({
        ...prev,
        [selectedTicket]: [...(prev[selectedTicket] || []), newMsg],
      }));

      setNewMessage("");
      clearFiles();
      toast({ title: "Mensagem enviada", description: "Sua resposta foi registrada." });
    } catch {
      toast({ title: "Erro", description: "Falha ao enviar mensagem.", variant: "destructive" });
    }
  };

  const createTicket = async () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      toast({ title: "Campos obrigatorios", description: "Preencha o assunto e a mensagem.", variant: "destructive" });
      return;
    }

    const user = getUser() || { full_name: "Cliente", email: "", phone: "" };

    const formData = new FormData();
    formData.append("name", user.full_name);
    formData.append("email", user.email);
    formData.append("phone", user.phone || "");
    formData.append("subject", newTicketSubject);
    formData.append("message", newTicketMessage);
    formData.append("priority", "high");
    attachments.forEach((file) => formData.append("attachments", file));

    try {
      const data = await apiPostForm<{ id: string }>("/support/ticket", formData);
      toast({ title: `Ticket ${data.id} criado`, description: "Seu ticket foi criado com sucesso." });
      setShowNewTicket(false);
      setNewTicketSubject("");
      setNewTicketMessage("");
      clearFiles();
      window.location.reload();
    } catch {
      toast({ title: "Erro", description: "Nao foi possivel criar o ticket. Tente novamente.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/iAfiliado.png"
              alt="iAfiliado"
              className="h-40 w-auto transition-transform duration-300 hover:scale-105"
            />
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              <span className="text-foreground">Suporte ao </span>
              <span className="text-gradient-neon">Cliente</span>
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus tickets e converse com nossa equipe
            </p>
          </div>
          <Button
            variant="neon"
            className="gap-2"
            onClick={() => {
              setShowNewTicket(true);
              setSelectedTicket(null);
            }}
          >
            <MessageSquare className="w-4 h-4" />
            Novo Ticket
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
          {/* Sidebar - Histórico de Tickets */}
          <Card className="lg:col-span-4 bg-card/80 border-border/50 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-muted/20">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Histórico de Tickets
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {tickets.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm">
                  Nenhum ticket encontrado.
                </div>
              ) : (
                tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket.id);
                      setShowNewTicket(false);
                      setAttachments([]);
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                      selectedTicket === ticket.id
                        ? "bg-primary/10 border-primary/30"
                        : "bg-card hover:bg-muted/50 border-border/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-foreground truncate pr-2">
                        SUP-{ticket.id} - {ticket.subject}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${getStatusColor(
                          ticket.status,
                        )}`}
                      >
                        {getStatusLabel(ticket.status)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {ticket.lastMessage}
                    </p>
                    <div className="mt-2 flex justify-between items-center text-[10px] text-muted-foreground">
                      <span>{ticket.updatedAt}</span>
                      {ticket.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                          {ticket.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Main Content Area */}
          <Card className="lg:col-span-8 bg-card/80 border-border/50 flex flex-col overflow-hidden h-full">
            {showNewTicket ? (
              <div className="p-6 h-full overflow-y-auto">
                <h2 className="text-xl font-display font-bold text-foreground mb-4">
                  Criar Novo Ticket
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Assunto
                    </label>
                    <Input
                      placeholder="Ex: Dúvida sobre comissões"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      className="bg-muted/30 border-border/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Mensagem
                    </label>
                    <Textarea
                      placeholder="Descreva sua dúvida ou problema..."
                      value={newTicketMessage}
                      onChange={(e) => setNewTicketMessage(e.target.value)}
                      className="bg-muted/30 border-border/50 min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Anexos (Prints/Imagens)
                    </label>
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="bg-muted/30 border-border/50 cursor-pointer"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="neon" onClick={createTicket}>
                      Criar Ticket
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewTicket(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            ) : selectedTicket ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {tickets.find((t) => t.id === selectedTicket)?.subject}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Equipe de Suporte
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages[selectedTicket]?.map((message) => {
                    const isUserMessage = message.sender === "user";
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isUserMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                            isUserMessage
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted text-foreground rounded-bl-md border border-border/50"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          {message.attachments &&
                            message.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {message.attachments.map((filename, idx) => (
                                  <a
                                    key={idx}
                                    href={`${API_BASE_URL}/uploads/${filename}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={`${API_BASE_URL}/uploads/${filename}`}
                                      alt="Anexo"
                                      className="max-w-full rounded-lg border border-border/50 hover:opacity-90 transition-opacity"
                                      style={{ maxHeight: "200px" }}
                                    />
                                  </a>
                                ))}
                              </div>
                            )}
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isUserMessage ? "justify-end" : "justify-start"
                            }`}
                          >
                            <span
                              className={`text-xs ${
                                isUserMessage
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {message.timestamp}
                            </span>
                            {isUserMessage && (
                              <CheckCheck
                                className={`w-3 h-3 ${
                                  message.read
                                    ? "text-primary-foreground"
                                    : "text-primary-foreground/50"
                                }`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-border/50 flex flex-col gap-2">
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, index) => (
                        <div key={index} className="relative group">
                          {file.type.startsWith("image/") ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-16 h-16 object-cover rounded-lg border border-border/50"
                            />
                          ) : (
                            <div className="w-16 h-16 flex items-center justify-center bg-muted rounded-lg border border-border/50 p-1">
                              <span className="text-[10px] text-center truncate w-full">
                                {file.name}
                              </span>
                            </div>
                          )}
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1 bg-muted/30 border-border/50"
                    />
                    <Button variant="ghost" size="icon">
                      <Smile className="w-4 h-4" />
                    </Button>
                    <Button variant="neon" size="icon" onClick={sendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Selecione um ticket para ver as mensagens
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SuporteCliente;
