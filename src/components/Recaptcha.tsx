import { useEffect, useRef, useState } from "react";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
const RECAPTCHA_SCRIPT = "https://www.google.com/recaptcha/api.js";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
        }
      ) => number;
      getResponse: (widgetId?: number) => string;
      reset: (widgetId?: number) => void;
      ready: (cb: () => void) => void;
    };
  }
}

interface RecaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  theme?: "light" | "dark";
}

export function Recaptcha({ onVerify, onExpire, theme = "light" }: RecaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const widgetIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!SITE_KEY) {
      setReady(false);
      return;
    }
    if (window.grecaptcha) {
      window.grecaptcha.ready(() => setReady(true));
      return;
    }
    const script = document.createElement("script");
    script.src = `${RECAPTCHA_SCRIPT}?onload=onRecaptchaLoad`;
    script.async = true;
    (window as unknown as { onRecaptchaLoad?: () => void }).onRecaptchaLoad = () => {
      window.grecaptcha?.ready(() => setReady(true));
    };
    document.head.appendChild(script);
    return () => {
      delete (window as unknown as { onRecaptchaLoad?: () => void }).onRecaptchaLoad;
    };
  }, []);

  useEffect(() => {
    if (!ready || !SITE_KEY || !containerRef.current) return;
    if (widgetIdRef.current != null) return;
    try {
      widgetIdRef.current = window.grecaptcha!.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onVerify(token),
        "expired-callback": () => onExpire?.(),
      });
    } catch {
      widgetIdRef.current = null;
    }
    return () => {
      widgetIdRef.current = null;
    };
  }, [ready, onVerify, onExpire]);

  if (!SITE_KEY) {
    return (
      <p className="text-sm text-muted-foreground">
        Por segurança, aguarde alguns minutos antes de tentar novamente.
      </p>
    );
  }

  return (
    <div className="flex justify-center my-2">
      <div ref={containerRef} data-theme={theme} />
    </div>
  );
}

/** Retorna o token atual do widget (para envio no login). Chamar apos o usuario completar o captcha. */
export function getRecaptchaToken(): string {
  if (typeof window === "undefined" || !window.grecaptcha) return "";
  return window.grecaptcha.getResponse() || "";
}
