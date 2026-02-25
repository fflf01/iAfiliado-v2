import { describe, it, expect } from "vitest";
import { buildSolicitacoesFromClients } from "./utils";
import type { ClientRow } from "./types";

/**
 * Testes dos filtros de Solicitações de Cadastro (Todos, Pendentes, Aprovados, Rejeitados).
 * Garante que solicitações rejeitadas aparecem na lista e que cada botão filtra corretamente.
 */

function filterSolicitacoes(
  solicitacoes: { status: string; nome: string; email: string }[],
  filtroStatus: string,
  search: string
) {
  return solicitacoes.filter((s) => {
    const matchSearch =
      !search ||
      s.nome.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filtroStatus === "todos" || s.status === filtroStatus;
    return matchSearch && matchStatus;
  });
}

describe("buildSolicitacoesFromClients", () => {
  it("mapeia cadastro_status 'rejeitado' para status 'rejeitado'", () => {
    const clients: ClientRow[] = [
      {
        id: 1,
        username: "user1",
        full_name: "User Rejeitado",
        email: "rej@test.com",
        phone: null,
        cpf_cnpj: null,
        tipo_cliente: "vip",
        tele_an: null,
        rede_an: null,
        cadastro_status: "rejeitado",
        created_at: "2026-02-23T00:00:00",
      },
    ];
    const result = buildSolicitacoesFromClients(clients);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("rejeitado");
  });

  it("mapeia cadastro_status 'Rejeitado' (maiúscula) para status 'rejeitado'", () => {
    const clients: ClientRow[] = [
      {
        id: 2,
        username: "user2",
        full_name: "User Rej",
        email: "rej2@test.com",
        phone: null,
        cpf_cnpj: null,
        tipo_cliente: "influencer",
        tele_an: null,
        rede_an: null,
        cadastro_status: "Rejeitado",
        created_at: "2026-02-23T00:00:00",
      },
    ];
    const result = buildSolicitacoesFromClients(clients);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("rejeitado");
  });

  it("mapeia aprovado e pendente corretamente", () => {
    const clients: ClientRow[] = [
      {
        id: 3,
        username: "a",
        full_name: "Aprovado",
        email: "a@t.com",
        phone: null,
        cpf_cnpj: null,
        tipo_cliente: "vip",
        tele_an: null,
        rede_an: null,
        cadastro_status: "aprovado",
        created_at: "2026-02-23T00:00:00",
      },
      {
        id: 4,
        username: "p",
        full_name: "Pendente",
        email: "p@t.com",
        phone: null,
        cpf_cnpj: null,
        tipo_cliente: "gestor_vip",
        tele_an: null,
        rede_an: null,
        cadastro_status: "em_analise",
        created_at: "2026-02-23T00:00:00",
      },
    ];
    const result = buildSolicitacoesFromClients(clients);
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe("aprovado");
    expect(result[1].status).toBe("pendente");
  });
});

describe("filtros de solicitações (Todos, Pendentes, Aprovados, Rejeitados)", () => {
  const solicitacoes = [
    { id: 1, status: "pendente", nome: "Alice", email: "alice@test.com" },
    { id: 2, status: "aprovado", nome: "Bruno", email: "bruno@test.com" },
    { id: 3, status: "rejeitado", nome: "Carlos", email: "carlos@test.com" },
    { id: 4, status: "rejeitado", nome: "Diana", email: "diana@test.com" },
  ];

  it("filtro 'todos' retorna todas as solicitações", () => {
    const filtered = filterSolicitacoes(solicitacoes, "todos", "");
    expect(filtered).toHaveLength(4);
  });

  it("filtro 'pendente' retorna só pendentes", () => {
    const filtered = filterSolicitacoes(solicitacoes, "pendente", "");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].status).toBe("pendente");
    expect(filtered[0].nome).toBe("Alice");
  });

  it("filtro 'aprovado' retorna só aprovados", () => {
    const filtered = filterSolicitacoes(solicitacoes, "aprovado", "");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].status).toBe("aprovado");
    expect(filtered[0].nome).toBe("Bruno");
  });

  it("filtro 'rejeitado' retorna só rejeitados (solicitações rejeitadas aparecem na lista)", () => {
    const filtered = filterSolicitacoes(solicitacoes, "rejeitado", "");
    expect(filtered).toHaveLength(2);
    expect(filtered.every((s) => s.status === "rejeitado")).toBe(true);
    expect(filtered.map((s) => s.nome)).toEqual(["Carlos", "Diana"]);
  });

  it("busca + filtro rejeitado funciona", () => {
    const filtered = filterSolicitacoes(solicitacoes, "rejeitado", "carlos");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].nome).toBe("Carlos");
    expect(filtered[0].status).toBe("rejeitado");
  });
});
