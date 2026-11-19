import { useState } from "react";
import { signupSourceMetadata } from "@/lib/signup-source";
import { Link } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  CaretLeftIcon,
  CircleNotchIcon,
  EnvelopeSimpleIcon,
  LockSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";

import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { useAuth } from "@/core/auth/auth-context";
import { isStrongPassword, PASSWORD_MIN_LENGTH } from "@/lib/password-security";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/button-styles";

type AuthMode = "login" | "signup" | "reset";

export function LoginPage() {
  const { signInWithEmail, signUpWithEmail, requestPasswordReset, loading, isDemo } = useAuth();
  const [mode, setMode] = useState<AuthMode>(() =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("modo") === "registro"
      ? "signup"
      : "login",
  );
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const [email, setEmail] = useState(isDemo ? "demo@artisan.app" : "");
  const [password, setPassword] = useState(isDemo ? "123456" : "");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Panadería");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setAwaitingConfirmation(false);
    setResetSent(false);
    setErrorMsg(null);
    setShowPassword(false);
  };

  const handleSignUpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    if (!fullName.trim() || !businessName.trim()) {
      setErrorMsg("Escribe tu nombre y el de tu negocio.");
      return;
    }
    if (!email.trim() || !password) {
      setErrorMsg("Completa tu correo y contraseña para continuar.");
      return;
    }
    if (!isStrongPassword(password)) {
      setErrorMsg("Tu contraseña aún no cumple los requisitos de abajo.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error, requiresEmailConfirmation } = await signUpWithEmail(
        email.trim().toLowerCase(),
        password,
        {
          full_name: fullName.trim(),
          phone: phone.trim() || undefined,
          business_name: businessName.trim(),
          business_type: businessType,
          ...signupSourceMetadata(),
        },
      );

      if (error) {
        setErrorMsg(authErrorMessage(error, "No pudimos crear tu cuenta. Intenta de nuevo."));
      } else if (requiresEmailConfirmation) {
        setPassword("");
        setAwaitingConfirmation(true);
      }
    } catch (error) {
      setErrorMsg(authErrorMessage(error, "No pudimos conectar con el servidor."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const { error } = await signInWithEmail(email.trim().toLowerCase(), password);
      if (error) {
        setErrorMsg(authErrorMessage(error, "No pudimos iniciar sesión. Intenta de nuevo."));
      }
    } catch (error) {
      setErrorMsg(authErrorMessage(error, "No pudimos conectar con el servidor."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);

    if (isDemo) {
      setErrorMsg("La recuperación no está disponible en la demostración local.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await requestPasswordReset(email.trim().toLowerCase());
      if (error) {
        setErrorMsg(authErrorMessage(error, "No pudimos enviar el enlace. Intenta de nuevo."));
      } else {
        setResetSent(true);
      }
    } catch (error) {
      setErrorMsg(authErrorMessage(error, "No pudimos conectar con el servidor."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const copy = authCopy(mode, awaitingConfirmation, resetSent);
  const headline =
    mode === "signup" ? (
      <>
        Tu primera venta, <span className="text-cta">en un minuto.</span>
      </>
    ) : mode === "reset" ? (
      <>
        Recupera <span className="text-cta">tu acceso.</span>
      </>
    ) : (
      <>
        Qué gusto verte,
        <br />
        <span className="text-cta">vamos a vender.</span>
      </>
    );

  return (
    <AuthShell headline={headline} showProductPeek={mode === "signup" && !awaitingConfirmation}>
      <div className="space-y-5">
        {mode !== "reset" && !awaitingConfirmation ? (
          <div
            role="tablist"
            aria-label="Tipo de acceso"
            className="grid grid-cols-2 gap-1 rounded-md border border-border p-1"
          >
            {(
              [
                ["signup", "Crear cuenta"],
                ["login", "Entrar"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={mode === key}
                onClick={() => switchMode(key)}
                className={cn(
                  "h-10 rounded-sm text-[14px] font-semibold transition-colors duration-150",
                  mode === key
                    ? "bg-text-primary text-primary-foreground"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div>
          {mode === "reset" && !resetSent ? (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="mb-3 inline-flex min-h-10 items-center gap-1.5 pr-3 text-[14px] font-semibold text-text-secondary transition-colors hover:text-text-primary"
            >
              <CaretLeftIcon className="h-4 w-4" aria-hidden="true" />
              Volver
            </button>
          ) : null}
          <h1 className="font-display text-[28px] font-black leading-tight tracking-[-0.02em] text-text-primary sm:text-[34px]">
            {copy.title}
          </h1>
          {copy.description ? (
            <p className="mt-1.5 text-[15px] text-text-secondary">{copy.description}</p>
          ) : null}
        </div>

        {errorMsg ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md bg-danger-bg px-3.5 py-3 text-[14px] leading-5 text-danger"
          >
            <WarningCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <EmailField email={email} setEmail={setEmail} invalid={Boolean(errorMsg)} />
            <PasswordInput
              id="login-password"
              label="Contraseña"
              value={password}
              onChange={setPassword}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              autoComplete="current-password"
              invalid={Boolean(errorMsg)}
              labelAction={
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="min-h-8 px-1 text-[13px] font-semibold text-accent-text hover:underline"
                >
                  ¿La olvidaste?
                </button>
              }
            />
            <SubmitButton loading={isSubmitting} disabled={loading} loadingLabel="Entrando…">
              Entrar
            </SubmitButton>
            <p className="flex items-start gap-2 rounded-md bg-surface-2 px-3.5 py-3 text-[13px] text-text-secondary">
              <LockSimpleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Tus datos son solo tuyos: nadie más ve tus ventas ni tus clientes.
            </p>
          </form>
        ) : null}

        {mode === "signup" && awaitingConfirmation ? (
          <StatusState
            icon={<EnvelopeSimpleIcon className="h-6 w-6" />}
            detail={
              <>
                Enviamos el enlace a{" "}
                <strong className="break-all text-text-primary">{email}</strong>. Revisa también la
                carpeta de spam.
              </>
            }
          >
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="mt-6 h-12 w-full rounded-md border border-border px-5 text-[15px] font-semibold text-text-primary transition-colors hover:border-text-primary"
            >
              Ir a Entrar
            </button>
          </StatusState>
        ) : null}

        {mode === "signup" && !awaitingConfirmation ? (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <TextField
              id="full-name"
              label="Tu nombre"
              value={fullName}
              onChange={setFullName}
              autoComplete="name"
              placeholder="María López"
            />
            <TextField
              id="business-name"
              label="Nombre del negocio"
              value={businessName}
              onChange={setBusinessName}
              autoComplete="organization"
              placeholder="Taller Ámbar"
            />
            <EmailField email={email} setEmail={setEmail} invalid={Boolean(errorMsg)} />
            <div className="space-y-2.5">
              <PasswordInput
                id="signup-password"
                label="Contraseña"
                value={password}
                onChange={setPassword}
                visible={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                autoComplete="new-password"
                describedBy="signup-password-requirements"
                invalid={Boolean(errorMsg) && !isStrongPassword(password)}
                minLength={PASSWORD_MIN_LENGTH}
              />
              {password ? (
                <PasswordRequirements id="signup-password-requirements" password={password} />
              ) : null}
            </div>

            <fieldset>
              <legend className="mb-2 text-[13px] font-bold text-text-primary">¿Qué vendes?</legend>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={businessType === type}
                    onClick={() => setBusinessType(type)}
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

            <SubmitButton loading={isSubmitting} loadingLabel="Creando tu cuenta…" variant="cta">
              Crear mi cuenta gratis
              <ArrowRightIcon className="h-5 w-5" weight="bold" aria-hidden="true" />
            </SubmitButton>

            <p className="text-center text-[12px] leading-5 text-text-muted">
              Sin tarjeta · Al crear tu cuenta aceptas los{" "}
              <Link to="/terminos" className="font-semibold text-accent-text hover:underline">
                Términos
              </Link>{" "}
              y el{" "}
              <Link to="/privacidad" className="font-semibold text-accent-text hover:underline">
                Aviso de privacidad
              </Link>
              .
            </p>
          </form>
        ) : null}

        {mode === "reset" && !resetSent ? (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <EmailField email={email} setEmail={setEmail} invalid={Boolean(errorMsg)} />
            <SubmitButton loading={isSubmitting} loadingLabel="Enviando…">
              Enviar enlace
            </SubmitButton>
          </form>
        ) : null}

        {mode === "reset" && resetSent ? (
          <StatusState
            icon={<EnvelopeSimpleIcon className="h-6 w-6" />}
            detail={
              <>
                Si existe una cuenta con{" "}
                <strong className="break-all text-text-primary">{email}</strong>, recibirás un
                enlace. Revisa también la carpeta de spam.
              </>
            }
          >
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="mt-6 h-12 w-full rounded-md border border-border px-5 text-[15px] font-semibold text-text-primary transition-colors hover:border-text-primary"
            >
              Ir a Entrar
            </button>
          </StatusState>
        ) : null}

        {isDemo ? (
          <p className="rounded-md bg-info-bg px-3.5 py-3 text-[13px] leading-5 text-info">
            <strong>Demostración local:</strong> usa demo@artisan.app para explorar la app.
          </p>
        ) : null}
      </div>
    </AuthShell>
  );
}

const BUSINESS_TYPES = [
  "Panadería",
  "Repostería",
  "Salsas y conservas",
  "Bebidas",
  "Velas y jabones",
  "Joyería",
  "Artesanías",
  "Otros",
];

const inputClassName =
  "h-12 w-full rounded-md border border-border bg-surface px-3.5 text-[16px] text-text-primary outline-none transition-[border-color,box-shadow] placeholder:text-text-muted focus:border-text-primary focus:ring-3 focus:ring-cta/25 aria-[invalid=true]:border-danger";

function TextField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-bold text-text-primary">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        required
        maxLength={100}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    </div>
  );
}

function EmailField({
  email,
  setEmail,
  invalid,
}: {
  email: string;
  setEmail: (value: string) => void;
  invalid: boolean;
}) {
  return (
    <div>
      <label htmlFor="auth-email" className="mb-2 block text-[13px] font-bold text-text-primary">
        Correo
      </label>
      <input
        id="auth-email"
        name="email"
        type="email"
        required
        maxLength={254}
        autoComplete="email"
        inputMode="email"
        aria-invalid={invalid || undefined}
        placeholder="nombre@negocio.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className={inputClassName}
      />
    </div>
  );
}

function SubmitButton({
  children,
  loading = false,
  disabled = false,
  loadingLabel = "Guardando…",
  variant = "primary",
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  loadingLabel?: string;
  variant?: "primary" | "cta";
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={buttonClass({ variant, size: "lg", block: true })}
    >
      {loading ? (
        <>
          <CircleNotchIcon className="h-5 w-5 animate-spin" aria-hidden="true" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function StatusState({
  icon,
  detail,
  children,
}: {
  icon: React.ReactNode;
  detail: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="grid h-12 w-12 place-items-center bg-cta text-cta-foreground">{icon}</div>
      <p className="mt-5 text-[14px] leading-6 text-text-secondary">{detail}</p>
      {children}
    </div>
  );
}

function authCopy(mode: AuthMode, awaitingConfirmation: boolean, resetSent: boolean) {
  if (awaitingConfirmation) {
    return {
      title: "Confirma tu correo",
      description: "Tu cuenta está lista. Solo falta verificar tu correo.",
    };
  }
  if (mode === "reset" && resetSent) {
    return { title: "Revisa tu correo", description: "Te enviamos cómo recuperar tu acceso." };
  }
  if (mode === "reset") {
    return {
      title: "¿Olvidaste tu contraseña?",
      description: "Escribe tu correo y te mandamos un enlace seguro.",
    };
  }
  if (mode === "signup") {
    return { title: "Crea tu cuenta gratis", description: "" };
  }
  return { title: "Entra a tu negocio", description: "" };
}

function authErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (message.includes("email not confirmed")) return "Confirma tu correo antes de iniciar sesión.";
  if (message.includes("user already registered")) return "Ya existe una cuenta con este correo.";
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Se hicieron demasiados intentos. Espera unos minutos y vuelve a intentar.";
  }
  if (message.includes("weak password")) {
    return "La contraseña no cumple los requisitos de seguridad.";
  }

  return fallback;
}
