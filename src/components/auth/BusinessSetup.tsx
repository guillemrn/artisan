import { useState } from "react";
import { ArrowRightIcon, CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { AuthShell } from "@/components/auth/AuthShell";
import { BUSINESS_TYPES } from "@/components/auth/business-types";
import { useAuth } from "@/core/auth/auth-context";
import { buttonClass } from "@/components/ui/button-styles";
import { signupSourceMetadata } from "@/lib/signup-source";
import { cn } from "@/lib/utils";

const inputClassName =
  "h-12 w-full rounded-md border border-border bg-surface px-3.5 text-[16px] text-text-primary outline-none transition-[border-color,box-shadow] placeholder:text-text-muted focus:border-text-primary focus:ring-3 focus:ring-cta/25";

/**
 * Último paso después de crear la cuenta (con Google o correo):
 * nombre del negocio (va en el ticket) y qué vende. Una sola pantalla.
 */
export function BusinessSetup() {
  const { user, updateProfile, signOut } = useAuth();
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  const [businessName, setBusinessName] = useState("");
  const [fullName, setFullName] = useState(meta.full_name || meta.name || "");
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!businessName.trim()) {
      setError("Escribe el nombre de tu negocio. Así aparece en tus tickets.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: saveError } = await updateProfile({
      business_name: businessName.trim(),
      full_name: fullName.trim() || undefined,
      business_type: businessType ?? undefined,
      ...(meta.signup_source ? {} : signupSourceMetadata()),
    });
    if (saveError) {
      setError("No pudimos guardar. Revisa tu conexión e intenta de nuevo.");
      setSaving(false);
    }
  };

  return (
    <AuthShell
      headline={
        <>
          Último paso,
          <br />
          <span className="text-cta">y a vender.</span>
        </>
      }
      showProductPeek={false}
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <h1 className="font-display text-[28px] font-black leading-tight tracking-[-0.02em] text-text-primary sm:text-[34px]">
            Tu negocio
          </h1>
          <p className="mt-1.5 text-[15px] text-text-secondary">Así aparece en tus tickets.</p>
        </div>

        {error ? (
          <div role="alert" className="flex items-start gap-2.5 rounded-md bg-danger-bg px-3.5 py-3 text-[14px] leading-5 text-danger">
            <WarningCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor="setup-business" className="text-[13px] font-bold text-text-primary">
            Nombre del negocio
          </label>
          <input
            id="setup-business"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            autoComplete="organization"
            placeholder="Taller Ámbar"
            autoFocus
            className={inputClassName}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="setup-name" className="text-[13px] font-bold text-text-primary">
            Tu nombre <span className="font-normal text-text-muted">(opcional)</span>
          </label>
          <input
            id="setup-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            placeholder="María López"
            className={inputClassName}
          />
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-bold text-text-primary">
            ¿Qué vendes? <span className="font-normal text-text-muted">(opcional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={businessType === type}
                onClick={() => setBusinessType(businessType === type ? null : type)}
                className={cn(
                  "h-10 rounded-md px-3.5 text-[14px] font-semibold transition-[background-color,border-color,transform] duration-150 active:scale-[0.97]",
                  businessType === type
                    ? "bg-text-primary text-primary-foreground"
                    : "border border-border text-text-primary hover:border-text-primary",
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </fieldset>

        <button type="submit" disabled={saving} className={buttonClass({ variant: "cta", size: "lg", block: true })}>
          {saving ? (
            <CircleNotchIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : null}
          {saving ? "Guardando…" : "Empezar a vender"}
          {!saving ? <ArrowRightIcon className="h-5 w-5" weight="bold" aria-hidden="true" /> : null}
        </button>

        <p className="text-center text-[13px] text-text-muted">
          {user?.email ? <>Entraste como {user.email} · </> : null}
          <button type="button" onClick={() => void signOut()} className="font-semibold text-accent-text hover:underline">
            Usar otra cuenta
          </button>
        </p>
      </form>
    </AuthShell>
  );
}
