import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Eye, EyeOff, ShieldCheck } from "lucide-react";

import { Logo } from "@/components/ui/logo";
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!isStrongPassword(password)) {
      setErrorMessage("Completa todos los requisitos de seguridad de la contraseña.");
      return;
    }

    if (password !== confirmation) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    const { error } = await updatePassword(password);

    if (error) {
      setErrorMessage("El enlace expiró o no es válido. Solicita uno nuevo.");
      setIsSubmitting(false);
      return;
    }

    await signOut();
    setIsComplete(true);
    setIsSubmitting(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F3EC] px-4 py-12 text-text-primary">
      <section className="w-full max-w-[480px] rounded-2xl border border-border bg-white p-8 shadow-card md:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo variant="full" className="mb-6 h-11 w-auto" />
          <h1 className="font-display text-[26px] font-bold leading-tight text-[#2F3437]">
            {isComplete ? "Contraseña actualizada" : "Crea una nueva contraseña"}
          </h1>
          <p className="mt-2 text-[14px] leading-6 text-text-secondary">
            {isComplete
              ? "Tu acceso quedó protegido con la nueva contraseña."
              : "Usa una contraseña distinta a las que utilizas en otros servicios."}
          </p>
        </div>

        {isComplete ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-11 w-11 text-primary" aria-hidden="true" />
            <Link
              to="/login"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-5 text-[15px] font-bold text-white transition hover:bg-[#246448]"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : session ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <PasswordField
              label="Nueva contraseña"
              value={password}
              onChange={setPassword}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
            />

            <PasswordRequirements password={password} />

            <PasswordField
              label="Confirma la contraseña"
              value={confirmation}
              onChange={setConfirmation}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
            />

            <div
              className={cn(
                "flex items-center gap-2 text-[12px] transition-colors",
                confirmation && confirmation === password
                  ? "font-semibold text-primary"
                  : "text-text-muted",
              )}
              aria-live="polite"
            >
              <span
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors",
                  confirmation && confirmation === password
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-white",
                )}
                aria-hidden="true"
              >
                {confirmation && confirmation === password ? (
                  <CheckCircle2 className="h-3 w-3" strokeWidth={3} />
                ) : null}
              </span>
              Las contraseñas coinciden
            </div>

            {errorMessage ? (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-medium text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-primary px-5 text-[15px] font-bold text-white transition hover:bg-[#246448] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Guardando…" : "Guardar nueva contraseña"}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-[13px] leading-5 text-amber-800">
              Este enlace expiró o no es válido. Solicita uno nuevo desde el inicio de sesión.
            </p>
            <Link to="/login" className="mt-5 inline-flex text-[13px] font-semibold text-primary hover:underline">
              Volver al inicio de sesión
            </Link>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 border-t border-border pt-6 text-[12px] text-text-muted">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          Tu contraseña se guarda de forma segura.
        </div>
      </section>
    </main>
  );
}

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
};

function PasswordField({ label, value, onChange, visible, onToggle }: PasswordFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-bold text-text-primary">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-lg border border-border px-3.5 pr-11 text-[16px] outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
