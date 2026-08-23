export type CookieConsentChoice = "accepted" | "essential";

export const COOKIE_CONSENT_KEY = "artisan_cookie_consent";

declare global {
  interface Window {
    loadArtisanAnalytics?: () => void;
  }
}

export function getCookieConsent(): CookieConsentChoice | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    return saved === "accepted" || saved === "essential" ? saved : null;
  } catch {
    return "essential";
  }
}

export function setCookieConsent(choice: CookieConsentChoice) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, choice);
  } catch {
    // If storage is unavailable, keep the session private and continue with essentials.
  }

  if (choice === "accepted") {
    window.loadArtisanAnalytics?.();
    window.dispatchEvent(new Event("artisan-cookie-consent-accepted"));
  }
}
