import { useCallback, useEffect, useRef } from "react";

interface UseSmartPollingOptions {
  /**
   * Callback chamado a cada tick de polling.
   * Se retornar true, e interpretado como "houve novos dados" e o backoff e resetado.
   */
  callback: () => void | boolean | Promise<void | boolean>;
  /**
   * Controla se o polling esta ativo.
   */
  enabled?: boolean;
  /**
   * Intervalo base em milissegundos quando ativo.
   * Default: 5000ms.
   */
  baseIntervalMs?: number;
  /**
   * Intervalo maximo em milissegundos (backoff).
   * Default: 60000ms.
   */
  maxIntervalMs?: number;
}

/**
 * Hook de polling com backoff exponencial e awareness de visibilidade da aba.
 *
 * Caracteristicas:
 * - Intervalo inicial (ativo): baseIntervalMs (default 5s).
 * - Backoff exponencial em inatividade/erro: 5s -> 10s -> 20s -> 40s -> 60s (maxIntervalMs).
 * - Quando document.hidden === true, usa sempre maxIntervalMs.
 * - Nao dispara nova requisicao se a anterior ainda estiver pendente.
 * - Faz cleanup de timers no unmount.
 */
export function useSmartPolling(options: UseSmartPollingOptions) {
  const { callback, enabled = true, baseIntervalMs = 5000, maxIntervalMs = 60000 } = options;

  const savedCallback = useRef(options.callback);
  const timerIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIntervalRef = useRef(baseIntervalMs);
  const isPendingRef = useRef(false);
  const isMountedRef = useRef(false);
  const enabledRef = useRef(enabled);

  // Mantem callback e enabled sempre atualizados sem recriar timers.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Funcoes auxiliares de controle de intervalo
  const resetIntervalToBase = useCallback(() => {
    currentIntervalRef.current = baseIntervalMs;
  }, [baseIntervalMs]);

  const increaseIntervalWithBackoff = useCallback(() => {
    const current = currentIntervalRef.current || baseIntervalMs;
    const next = Math.min(current * 2, maxIntervalMs);
    currentIntervalRef.current = next;
  }, [baseIntervalMs, maxIntervalMs]);

  const clearTimer = useCallback(() => {
    if (timerIdRef.current != null) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  const scheduleNextTick = useCallback(() => {
    if (!enabledRef.current || !isMountedRef.current) return;

    const base = currentIntervalRef.current || baseIntervalMs;
    const interval = document.hidden ? maxIntervalMs : base;

    clearTimer();
    timerIdRef.current = setTimeout(async () => {
      if (!enabledRef.current || !isMountedRef.current) return;

      // Nao inicia outra requisicao se ainda ha uma pendente.
      if (isPendingRef.current) {
        scheduleNextTick();
        return;
      }

      isPendingRef.current = true;
      try {
        const result = await savedCallback.current();
        const hasNewData = result === true;

        if (hasNewData) {
          // Nova mensagem recebida: volta para intervalo base.
          resetIntervalToBase();
        } else if (!document.hidden) {
          // Inatividade: backoff exponencial ate maxIntervalMs.
          increaseIntervalWithBackoff();
        }
      } catch {
        // Falha de rede/erro: aplica backoff tambem, evitando loop agressivo.
        if (!document.hidden) {
          increaseIntervalWithBackoff();
        }
      } finally {
        isPendingRef.current = false;
        scheduleNextTick();
      }
    }, interval);
  }, [baseIntervalMs, clearTimer, increaseIntervalWithBackoff, maxIntervalMs, resetIntervalToBase]);

  // Inicia/para o polling.
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      resetIntervalToBase();

      // Executa uma vez imediatamente para nao depender do primeiro timeout.
      (async () => {
        isPendingRef.current = true;
        try {
          const result = await savedCallback.current();
          const hasNewData = result === true;
          if (hasNewData) {
            resetIntervalToBase();
          }
        } catch {
          // Ignora, trata-se de primeira tentativa.
        } finally {
          isPendingRef.current = false;
          scheduleNextTick();
        }
      })();
    }

    return () => {
      isMountedRef.current = false;
      clearTimer();
    };
  }, [enabled, resetIntervalToBase, scheduleNextTick, clearTimer]);

  // visibilitychange: ao voltar o foco para a aba, resetar backoff.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && enabledRef.current && isMountedRef.current) {
        resetIntervalToBase();
        // Reagenda proximo tick usando intervalo base.
        scheduleNextTick();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resetIntervalToBase, scheduleNextTick]);

  // API publica do hook: permite resetar backoff em interacoes do usuario/envio de mensagens.
  const notifyActivity = useCallback(() => {
    if (!enabledRef.current || !isMountedRef.current) return;
    resetIntervalToBase();
    scheduleNextTick();
  }, [resetIntervalToBase, scheduleNextTick]);

  return { notifyActivity };
}

