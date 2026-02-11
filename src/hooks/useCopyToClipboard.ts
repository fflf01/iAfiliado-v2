/**
 * Hook reutilizavel para copiar texto para a area de transferencia.
 * Extraido de Dashboard.tsx e link.tsx.
 */

import { useState, useCallback } from "react";

export function useCopyToClipboard(resetDelay = 2000) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback(
    async (text: string, id: string) => {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), resetDelay);
    },
    [resetDelay]
  );

  return { copy, copiedId };
}
