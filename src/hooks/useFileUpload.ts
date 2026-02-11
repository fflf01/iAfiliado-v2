/**
 * Hook reutilizavel para upload de arquivos.
 * Extraido de suporteadmin.tsx, SuporteCliente.tsx e Suporte.tsx.
 */

import { useState, useCallback } from "react";

export function useFileUpload() {
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        setAttachments(Array.from(e.target.files));
      }
    },
    []
  );

  const removeFile = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => setAttachments([]), []);

  return { attachments, handleFileChange, removeFile, clearFiles };
}
