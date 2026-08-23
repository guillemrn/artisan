import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState } from "react";

import { getCookieConsent } from "@/lib/cookie-consent";

declare global {
  interface Window {
    __artisanClarityLoaded?: boolean;
    clarity?: (...args: unknown[]) => void;
  }
}

function loadClarity() {
  const clarityId = import.meta.env.VITE_CLARITY_ID;
  if (!clarityId) return;
  if (window.__artisanClarityLoaded) return;
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") return;

  window.__artisanClarityLoaded = true;
  if (!window.clarity) {
    const clarityQueue = function (...args: unknown[]) {
      clarityQueue.q = clarityQueue.q || [];
      clarityQueue.q.push(args);
    } as Window["clarity"] & { q?: unknown[][] };

    window.clarity = clarityQueue;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${clarityId}`;
  document.head.appendChild(script);
}

export function ConsentAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const accepted = getCookieConsent() === "accepted";
      setEnabled(accepted);
      if (accepted) loadClarity();
    };

    refresh();
    window.addEventListener("artisan-cookie-consent-accepted", refresh);
    return () => window.removeEventListener("artisan-cookie-consent-accepted", refresh);
  }, []);

  return enabled ? <Analytics /> : null;
}
