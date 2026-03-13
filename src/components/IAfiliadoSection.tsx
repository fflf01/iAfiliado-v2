import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Smartphone, Instagram, Briefcase } from "lucide-react";

interface IAfiliadoSectionProps {
  showOptions: boolean;
  onToggleOptions: (checked: boolean) => void;
  formData: {
    iAfiliadoType: string;
    analysisContact: string;
    [key: string]: any;
  };
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
}

const IAfiliadoSection: React.FC<IAfiliadoSectionProps> = ({
  showOptions,
  onToggleOptions,
  formData,
  onChange,
}) => {
  const isInfluencer = formData.iAfiliadoType === "influencer";

  return (
    <div className="space-y-4 border border-border/50 rounded-xl p-4 bg-card/50 transition-all duration-300 hover:border-primary/30">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="iAfiliado"
          checked={showOptions}
          onChange={(e) => onToggleOptions(e.target.checked)}
          className="w-5 h-5 rounded border-input bg-background text-primary focus:ring-2 focus:ring-ring cursor-pointer accent-[var(--cor-principal)]"
        />
        <Label
          htmlFor="iAfiliado"
          className="text-foreground font-medium cursor-pointer select-none"
        >
          Quero ser um{" "}
          <span className="texto-gradiente-secundario">iAfiliado</span>
        </Label>
      </div>

      {showOptions && (
        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Tipo de Afiliado */}
          <div className="space-y-2">
            <Label htmlFor="iAfiliadoType" className="text-foreground">
              Tipo de Atuação
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
              <Select
                value={formData.iAfiliadoType}
                onValueChange={(value) =>
                  onChange({
                    target: { name: "iAfiliadoType", value },
                  } as any)
                }
              >
                <SelectTrigger
                  id="iAfiliadoType"
                  className="w-full h-12 pl-11 pr-10 bg-card border border-border text-foreground"
                >
                  <SelectValue placeholder="Selecione seu perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gestor_vip">VIP Manager</SelectItem>
                  <SelectItem value="gestor_afiliados">
                    Affiliate Manager
                  </SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contato para Análise */}
          <div className="space-y-2">
            <Label htmlFor="analysisContact" className="text-foreground">
              {isInfluencer
                ? "Rede social para análise"
                : "WhatsApp para análise"}
            </Label>
            <div className="relative">
              {isInfluencer ? (
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              ) : (
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              )}
              <Input
                id="analysisContact"
                name="analysisContact"
                type="text"
                placeholder={isInfluencer ? "@seu.perfil" : "(00) 00000-0000"}
                value={formData.analysisContact}
                onChange={onChange}
                required={showOptions}
                className="pl-11 h-12 bg-card border-border focus-borda-principal"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isInfluencer
                ? "Informe seu perfil para análise de engajamento."
                : "Entraremos em contato para validar seu cadastro."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IAfiliadoSection;
