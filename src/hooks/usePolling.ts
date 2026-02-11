/**
 * Hook reutilizavel para polling periodico com cleanup automatico.
 * Extraido de suporteadmin.tsx e SuporteCliente.tsx.
 */

import { useEffect, useRef } from "react";

/**
 * Executa callback imediatamente e depois a cada `intervalMs` milissegundos.
 * Limpa o intervalo automaticamente no unmount.
 */
export function usePolling(
  callback: () => void,
  intervalMs: number,
  enabled = true
) {
  const savedCallback = useRef(callback);

  // Atualiza ref a cada render para evitar stale closures
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    // Execucao imediata
    savedCallback.current();

    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
