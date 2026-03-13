import { describe, expect, it } from "vitest";
import { resolveCasinoLogo } from "./casino-logo";

describe("resolveCasinoLogo", () => {
  it("resolve por nome quando id e um UUID", () => {
    const logo = resolveCasinoLogo("Energia Bet", "8c32853c-83fd-4c23-a7f0-2e2f1f4ef211");
    expect(logo).toContain("/src/assets/logos/Enegia.png");
  });

  it("resolve por nome com pontuacao e espacos", () => {
    const logo = resolveCasinoLogo("MC Games .BET.BR");
    expect(logo).toContain("/src/assets/logos/MCGames.png");
  });

  it("retorna placeholder quando nao encontra correspondencia", () => {
    const logo = resolveCasinoLogo("Marca Inexistente");
    expect(logo).toContain("https://placehold.co/");
  });
});
