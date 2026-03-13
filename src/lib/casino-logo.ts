import enegiaLogo from "@/assets/logos/Enegia.png";
import bravoLogo from "@/assets/logos/Bravo.png";
import mcGamesLogo from "@/assets/logos/MCGames.png";
import playBetLogo from "@/assets/logos/PlayBet.png";
import galeraBetLogo from "@/assets/logos/Galerabet.png";
import braBetLogo from "@/assets/logos/BraBet.png";
import betDaSorteLogo from "@/assets/logos/BetdaSorte.png";
import estrelaBetLogo from "@/assets/logos/estrelabet.png";
import betsulLogo from "@/assets/logos/betsul.png";
import goldbetLogo from "@/assets/logos/goldbet.png";
import multibetLogo from "@/assets/logos/multibet2.png";
import geralbetLogo from "@/assets/logos/geralbet.png";
import seubetLogo from "@/assets/logos/seubet.png";

export const casinoLogoMap: Record<string, string> = {
  enegia: enegiaLogo,
  energia: enegiaLogo,
  energiabet: enegiaLogo,
  bravo: bravoLogo,
  bravobet: bravoLogo,
  mcgames: mcGamesLogo,
  playbet: playBetLogo,
  galerabet: galeraBetLogo,
  brabet: braBetLogo,
  betdasorte: betDaSorteLogo,
  estrelabet: estrelaBetLogo,
  betsul: betsulLogo,
  goldbet: goldbetLogo,
  multibet: multibetLogo,
  multibet2: multibetLogo,
  geralbet: geralbetLogo,
  seubet: seubetLogo,
};

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function resolveCasinoLogo(casinoName: string, casinoId?: string | null): string {
  const normalizedName = normalizeKey(casinoName || "");
  const normalizedId = normalizeKey(casinoId || "");

  if (normalizedId && casinoLogoMap[normalizedId]) {
    return casinoLogoMap[normalizedId];
  }

  if (normalizedName && casinoLogoMap[normalizedName]) {
    return casinoLogoMap[normalizedName];
  }

  if (normalizedName) {
    for (const [mapKey, logo] of Object.entries(casinoLogoMap)) {
      if (normalizedName.includes(mapKey)) {
        return logo;
      }
    }
  }

  return `https://placehold.co/200x80/1e293b/ffffff?text=${encodeURIComponent(casinoName)}`;
}
