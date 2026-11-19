/**
 * Origen del registro (atribución de primera parte, sin cookies de terceros).
 * Se guarda el último origen con UTM o referer externo que trajo a la persona,
 * y al crear la cuenta se manda en user_metadata para medir en Supabase
 * cuántos llegaron por el QR, redes, etc., y cuántos registraron su primera venta.
 */
export type SignupSource = {
  source: string;
  medium?: string;
  campaign?: string;
  landing_path: string;
  captured_at: string;
};

export const SIGNUP_SOURCE_KEY = "artisan_signup_source";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const clean = (value: string | null) => {
  const v = value?.trim().toLowerCase().slice(0, 60);
  return v ? v.replace(/[^a-z0-9_.-]/g, "-") : undefined;
};

/** Lee el origen de una URL y su referer. Devuelve null si no hay nada que atribuir. */
export function parseSignupSource(
  href: string,
  referrer: string,
  now = new Date(),
): SignupSource | null {
  const url = new URL(href);
  const source = clean(url.searchParams.get("utm_source")) ?? clean(url.searchParams.get("ref"));
  const medium = clean(url.searchParams.get("utm_medium"));
  const campaign = clean(url.searchParams.get("utm_campaign"));

  let fallback: string | undefined;
  if (!source && referrer) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, "");
      if (host && host !== url.hostname) fallback = clean(host);
    } catch {
      // referer inválido: se ignora
    }
  }

  const finalSource = source ?? fallback;
  if (!finalSource) return null;
  return {
    source: finalSource,
    medium: medium ?? (source ? undefined : "referral"),
    campaign,
    landing_path: url.pathname,
    captured_at: now.toISOString(),
  };
}

export function captureSignupSource() {
  if (typeof window === "undefined") return;
  try {
    const parsed = parseSignupSource(window.location.href, document.referrer);
    if (parsed) window.localStorage.setItem(SIGNUP_SOURCE_KEY, JSON.stringify(parsed));
  } catch {
    // sin almacenamiento: no hay atribución, la app sigue igual
  }
}

/** Campos para user_metadata al registrarse. Vacío si no hay origen o ya caducó. */
export function signupSourceMetadata(now = new Date()): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(SIGNUP_SOURCE_KEY);
    if (!raw) return { signup_source: "directo" };
    const saved = JSON.parse(raw) as SignupSource;
    if (now.getTime() - new Date(saved.captured_at).getTime() > MAX_AGE_MS) {
      return { signup_source: "directo" };
    }
    return Object.fromEntries(
      Object.entries({
        signup_source: saved.source,
        signup_medium: saved.medium,
        signup_campaign: saved.campaign,
        signup_landing: saved.landing_path,
      }).filter(([, v]) => Boolean(v)),
    ) as Record<string, string>;
  } catch {
    return {};
  }
}
