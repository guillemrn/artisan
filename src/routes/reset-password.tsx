import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Check, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { useAuth } from "@/core/auth/auth-context";
import { cn } from "@/lib/utils";
import { isStrongPassword, PASSWORD_MIN_LENGTH } from "@/lib/password-security";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nueva contraseña — Artisan" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { session, updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const passwordsMatch = Boolean(confirmation) && password === confirmation;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    if (!isStrongPassword(password)) {
      setErrorMessage("Completa todos los requisitos de seguridad de la contraseña.");
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await updatePassword(password);
      if (error) {
        setErrorMessage("El enlace expiró o ya fue utilizado. Solicita uno nuevo.");
        return;
      }

      await signOut();
      setIsComplete(true);
    } catch {
      setErrorMessage("No pudimos actualizar la contraseña. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = isComplete
    ? "Contraseña actualizada"
    : session
      ? "Crea una nueva contraseña"
      : "El enlace ya no es válido";
  const description = isComplete
    ? "Tu cuenta quedó protegida con la nueva contraseña."
    : session
      ? "Elige una contraseña segura y distinta a las que usas en otros servicios."
      : "Puede haber expirado o haber sido utilizado anteriormente.";

  return (
    <AuthShell>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-[32px] font-bold leading-[1.12] text-text-primary sm:text-[36px]">
            {title}
          </h1>
          <p className="mt-3 max-w-[44ch] text-[15px] leading-6 text-text-secondary">
            {description}
          </p>
        </div>

        {isComplete ? (
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-light text-primary">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <Link
              to="/login"
              className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-[15px] font-bold text-white shadow-fab transition-colors hover:bg-[#1f5b41] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : session ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <PasswordInput
                id="new-password"
                label="Nueva contraseña"
                value={password}
                onChange={setPassword}
                visible={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                autoComplete="new-password"
                describedBy="reset-password-requirements"
                invalid={Boolean(errorMessage) && !isStrongPassword(password)}
                minLength={PASSWORD_MIN_LENGTH}
              />
              <PasswordRequirements id="reset-password-requirements" password={password} />
            </div>

            <div className="space-y-3">
              <PasswordInput
                id="confirm-password"
                label="Confirma la contraseña"
                value={confirmation}
                onChange={setConfirmation}
                visible={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                autoComplete="new-password"
                invalid={Boolean(errorMessage) && !passwordsMatch}
                minLength={PASSWORD_MIN_LENGTH}
              />
              <div
                className={cn(
                  "flex items-center gap-2 text-[12px] transition-colors",
                  passwordsMatch ? "font-semibold text-primary" : "text-[#66716b]",
                )}
                aria-live="polite"
              >
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors",
                    passwordsMatch
                      ? "border-primary bg-primary text-white"
                      : "border-[#cbd3ce] bg-white",
                  )}
                  aria-hidden="true"
                >
                  {passwordsMatch ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                </span>
                Las contraseñas coinciden
              </div>
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] leading-5 text-red-800"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !isStrongPassword(password) || !passwordsMatch}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-bold text-white shadow-fab transition-colors hover:bg-[#1f5b41] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Guardando…
                </>
              ) : (
                "Guardar nueva contraseña"
              )}
            </button>
          </form>
        ) : (
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-5 text-[14px] leading-6 text-text-secondary">
              Solicita un enlace nuevo desde el inicio de sesión. Por seguridad, cada enlace solo
              puede utilizarse una vez.
            </p>
            <Link
              to="/login"
              className="mt-7 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-5 text-[15px] font-bold text-white shadow-fab transition-colors hover:bg-[#1f5b41] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Solicitar otro enlace
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-border pt-6 text-[12px] text-text-muted">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          Artisan nunca enviará tu contraseña por correo.
        </div>
      </div>
    </AuthShell>
  );
}
