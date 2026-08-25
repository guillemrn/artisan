import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

import { setCookieConsent, type CookieConsentChoice } from "@/lib/cookie-consent";

const CONSENT_LABEL: Record<CookieConsentChoice, string> = {
  accepted: "Medición aceptada",
  essential: "Solo esenciales",
};

export function CookieBanner() {
  const [choice, setChoice] = useState<CookieConsentChoice | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("artisan_cookie_consent");
      if (saved === "accepted" || saved === "essential") setChoice(saved);
    } catch {
      setChoice("essential");
    }
  }, []);

  useEffect(() => {
    if (choice === null) {
      document.documentElement.dataset.cookieBanner = "visible";
    } else {
      delete document.documentElement.dataset.cookieBanner;
    }

    return () => {
      delete document.documentElement.dataset.cookieBanner;
    };
  }, [choice]);

  const choose = (nextChoice: CookieConsentChoice) => {
    setCookieConsent(nextChoice);
    setChoice(nextChoice);
  };

  if (choice) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="mx-auto flex w-[calc(100vw-1.5rem)] max-w-5xl min-w-0 flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.45)] sm:w-full sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5">
        <div className="flex gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-light text-primary">
            <Cookie className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-text-primary">Privacidad y cookies</p>
            <p className="mt-1 max-w-2xl text-[13px] leading-5 text-text-secondary sm:text-sm sm:leading-6">
              <span className="sm:hidden">Usamos cookies esenciales. La medición es opcional.</span>
              <span className="hidden sm:inline">
                Usamos lo esencial para que Artisan funcione. La medición de uso solo se activa si
                la aceptas.
              </span>
            </p>
            <Link
              to="/cookies"
              className="mt-2 inline-flex text-sm font-semibold text-primary hover:underline"
            >
              Ver política de cookies
            </Link>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-row">
          <button
            type="button"
            className="inline-flex h-11 min-w-0 items-center justify-center rounded-lg border border-border bg-white px-3 text-xs font-bold text-text-primary transition hover:bg-surface sm:px-4 sm:text-sm"
            onClick={() => choose("essential")}
            aria-label={CONSENT_LABEL.essential}
          >
            Solo esenciales
          </button>
          <button
            type="button"
            className="inline-flex h-11 min-w-0 items-center justify-center rounded-lg bg-primary px-3 text-xs font-bold text-white transition hover:bg-[#1f5b41] sm:px-4 sm:text-sm"
            onClick={() => choose("accepted")}
            aria-label={CONSENT_LABEL.accepted}
          >
            <span className="sm:hidden">Aceptar</span>
            <span className="hidden sm:inline">Aceptar medición</span>
          </button>
        </div>
      </div>
    </div>
  );
}
