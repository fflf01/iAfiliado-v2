import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Crown,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Trash2,
  BarChart3,
  MousePointer,
  Users,
  QrCode,
  Share2,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  clicks: number;
  conversions: number;
  createdAt: string;
  platform: string;
}

const Links = () => {
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showNewLinkForm, setShowNewLinkForm] = useState(false);
  const [newLinkName, setNewLinkName] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("bet365");

  const [links, setLinks] = useState<AffiliateLink[]>([
    {
      id: "1",
      name: "Link Principal",
      url: "https://casino.com/ref/usuario123",
      clicks: 1250,
      conversions: 45,
      createdAt: "15/01/2024",
      platform: "Bet365",
    },
    {
      id: "2",
      name: "Promoção Instagram",
      url: "https://casino.com/promo/usuario123",
      clicks: 890,
      conversions: 32,
      createdAt: "20/01/2024",
      platform: "Betano",
    },
    {
      id: "3",
      name: "Campanha YouTube",
      url: "https://casino.com/yt/usuario123",
      clicks: 2100,
      conversions: 78,
      createdAt: "25/01/2024",
      platform: "Stake",
    },
    {
      id: "4",
      name: "Link TikTok",
      url: "https://casino.com/tt/usuario123",
      clicks: 560,
      conversions: 18,
      createdAt: "01/02/2024",
      platform: "1xBet",
    },
  ]);

  const copyToClipboard = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(id);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const createNewLink = () => {
    if (!newLinkName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o link.",
        variant: "destructive",
      });
      return;
    }

    const newLink: AffiliateLink = {
      id: Date.now().toString(),
      name: newLinkName,
      url: `https://casino.com/${newLinkName
        .toLowerCase()
        .replace(/\s/g, "-")}/usuario123`,
      clicks: 0,
      conversions: 0,
      createdAt: new Date().toLocaleDateString("pt-BR"),
      platform: selectedPlatform,
    };

    setLinks([newLink, ...links]);
    setNewLinkName("");
    setShowNewLinkForm(false);
    toast({
      title: "Link criado!",
      description: "Seu novo link de afiliado foi criado com sucesso.",
    });
  };

  const deleteLink = (id: string) => {
    setLinks(links.filter((link) => link.id !== id));
    toast({
      title: "Link removido",
      description: "O link foi removido com sucesso.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Crown className="w-8 h-8 text-secondary" />
            <span className="text-xl font-display font-bold text-gradient-gold">
              CasinoAff
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              <span className="text-foreground">Meus </span>
              <span className="text-gradient-neon">Links</span>
            </h1>
            <p className="text-muted-foreground">
              Gerencie e acompanhe seus links de afiliado
            </p>
          </div>
          <Button
            variant="neon"
            className="gap-2"
            onClick={() => setShowNewLinkForm(!showNewLinkForm)}
          >
            <Plus className="w-4 h-4" />
            Novo Link
          </Button>
        </div>

        {/* New Link Form */}
        {showNewLinkForm && (
          <Card className="bg-card/80 border-border/50 p-6 mb-8">
            <h2 className="text-xl font-display font-bold text-foreground mb-4">
              Criar Novo Link
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Nome do Link
                </label>
                <Input
                  placeholder="Ex: Campanha Facebook"
                  value={newLinkName}
                  onChange={(e) => setNewLinkName(e.target.value)}
                  className="bg-muted/30 border-border/50"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Plataforma
                </label>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-muted/30 border border-border/50 text-foreground"
                >
                  <option value="Bet365">Bet365</option>
                  <option value="Betano">Betano</option>
                  <option value="Stake">Stake</option>
                  <option value="1xBet">1xBet</option>
                  <option value="Sportingbet">Sportingbet</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="neon"
                  onClick={createNewLink}
                  className="flex-1"
                >
                  Criar Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewLinkForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card/80 border-border/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <MousePointer className="w-6 h-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  Total de Cliques
                </p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {links
                    .reduce((sum, link) => sum + link.clicks, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-card/80 border-border/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">
                  Total Conversões
                </p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {links.reduce((sum, link) => sum + link.conversions, 0)}
                </p>
              </div>
            </div>
          </Card>
          <Card className="bg-card/80 border-border/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Links Ativos</p>
                <p className="text-2xl font-display font-bold text-foreground">
                  {links.length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Links List */}
        <div className="space-y-4">
          {links.map((link) => (
            <Card
              key={link.id}
              className="bg-card/80 border-border/50 p-6 hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-display font-bold text-foreground text-lg">
                      {link.name}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary">
                      {link.platform}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3 font-mono">
                    {link.url}
                  </p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <MousePointer className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">
                        {link.clicks.toLocaleString()} cliques
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-secondary" />
                      <span className="text-muted-foreground">
                        {link.conversions} conversões
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      Criado em {link.createdAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(link.url, link.id)}
                    title="Copiar link"
                  >
                    {copiedLink === link.id ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="icon" title="QR Code">
                    <QrCode className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" title="Compartilhar">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" title="Estatísticas">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    title="Abrir link"
                    onClick={() => window.open(link.url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteLink(link.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Links;
