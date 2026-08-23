import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState } from "react";

import { getCookieConsent } from "@/lib/cookie-consent";

export function ConsentAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const refresh = () => setEnabled(getCookieConsent() === "accepted");

    refresh();
    window.addEventListener("artisan-cookie-consent-accepted", refresh);
    return () => window.removeEventListener("artisan-cookie-consent-accepted", refresh);
  }, []);

  return enabled ? <Analytics /> : null;
}
