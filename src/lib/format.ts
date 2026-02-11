/**
 * Funcoes de formatacao reutilizaveis.
 * Extraidas de Register.tsx, Suporte.tsx e outras paginas.
 */

/** Formata numero de telefone brasileiro: (XX) XXXXX-XXXX */
export function formatPhoneNumber(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 11) digits = digits.slice(0, 11);
  digits = digits.replace(/^(\d{2})(\d)/g, "($1) $2");
  return digits.replace(/(\d)(\d{4})$/, "$1-$2");
}

/** Formata valor em reais: R$ 1.234,56 */
export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Formata data para exibicao: DD/MM/AAAA HH:MM */
export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Formata hora: HH:MM */
export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
