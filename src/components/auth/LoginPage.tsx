import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ChevronLeft,
  Loader2,
  MailCheck,
  Phone,
  Store,
  Tag,
  User as UserIcon,
} from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { useAuth } from "@/core/auth/auth-context";
import { isStrongPassword, PASSWORD_MIN_LENGTH } from "@/lib/password-security";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "signup" | "reset";

export function LoginPage() {
  const { signInWithEmail, signUpWithEmail, requestPasswordReset, loading, isDemo } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [signUpStep, setSignUpStep] = useState(1);
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
    setSignUpStep(1);
    setAwaitingConfirmation(false);
    setResetSent(false);
    setErrorMsg(null);
    setShowPassword(false);
  };

  const handleNextStep = (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Completa tu correo y contraseña para continuar.");
      return;
    }

    if (!isStrongPassword(password)) {
      setErrorMsg("Completa todos los requisitos de seguridad de la contraseña.");
      return;
    }

    setSignUpStep(2);
  };

  const handleSignUpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
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

  const copy = authCopy(mode, signUpStep, awaitingConfirmation, resetSent);

  return (
    <AuthShell>
      <div className="space-y-8">
        {mode !== "reset" && !awaitingConfirmation ? (
          <div className="grid grid-cols-2 rounded-xl bg-[#f0f3f1] p-1" aria-label="Tipo de acceso">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={cn(
                "h-10 rounded-lg text-[13px] font-bold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                mode === "login"
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              )}
              aria-pressed={mode === "login"}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={cn(
                "h-10 rounded-lg text-[13px] font-bold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                mode === "signup"
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-secondary hover:text-text-primary",
              )}
              aria-pressed={mode === "signup"}
            >
              Crear cuenta
            </button>
          </div>
        ) : null}

        <div>
          {mode === "reset" && !resetSent ? (
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="mb-6 inline-flex min-h-11 items-center gap-1.5 rounded-lg pr-3 text-[13px] font-semibold text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Volver
            </button>
          ) : null}
          <h1 className="font-display text-[32px] font-bold leading-[1.12] text-text-primary sm:text-[36px]">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-[42ch] text-[15px] leading-6 text-text-secondary">
            {copy.description}
          </p>
        </div>

        {mode === "signup" && !awaitingConfirmation ? (
          <div aria-label={`Paso ${signUpStep} de 2`}>
            <div className="mb-2 flex items-center justify-between text-[12px] font-semibold text-text-secondary">
              <span>{signUpStep === 1 ? "Datos de acceso" : "Tu negocio"}</span>
              <span>Paso {signUpStep} de 2</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-[#e7ece9]">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: signUpStep === 1 ? "50%" : "100%" }}
              />
            </div>
          </div>
        ) : null}

        {errorMsg ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] leading-5 text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        {mode === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate={false}>
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
                  className="min-h-8 rounded-md px-1 text-[12px] font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              }
            />
            <PrimaryButton loading={isSubmitting} disabled={loading} loadingLabel="Ingresando…">
              Iniciar sesión
            </PrimaryButton>
          </form>
        ) : null}

        {mode === "signup" && awaitingConfirmation ? (
          <StatusState
            icon={<MailCheck className="h-6 w-6" />}
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
              className="mt-7 h-12 w-full rounded-xl border border-[#dfe4e0] bg-white px-5 text-[14px] font-bold text-text-primary transition-colors hover:bg-[#f6f8f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Volver al inicio de sesión
            </button>
          </StatusState>
        ) : null}

        {mode === "signup" && !awaitingConfirmation && signUpStep === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-5">
            <EmailField email={email} setEmail={setEmail} invalid={Boolean(errorMsg)} />
            <div className="space-y-3">
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
              <PasswordRequirements id="signup-password-requirements" password={password} />
            </div>
            <PrimaryButton>Continuar</PrimaryButton>
          </form>
        ) : null}

        {mode === "signup" && !awaitingConfirmation && signUpStep === 2 ? (
          <form onSubmit={handleSignUpSubmit} className="space-y-5">
            <button
              type="button"
              onClick={() => {
                setSignUpStep(1);
                setErrorMsg(null);
              }}
              className="inline-flex min-h-10 items-center gap-1 rounded-lg pr-3 text-[12px] font-semibold text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Cambiar datos de acceso
            </button>

            <LabeledIconField
              id="full-name"
              label="Nombre completo"
              icon={<UserIcon className="h-4.5 w-4.5" />}
            >
              <input
                id="full-name"
                name="full-name"
                type="text"
                required
                maxLength={100}
                autoComplete="name"
                placeholder="María López"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={fieldClassName}
              />
            </LabeledIconField>

            <LabeledIconField
              id="business-name"
              label="Nombre del negocio"
              icon={<Store className="h-4.5 w-4.5" />}
            >
              <input
                id="business-name"
                name="business-name"
                type="text"
                required
                maxLength={100}
                autoComplete="organization"
                placeholder="Mi emprendimiento"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                className={fieldClassName}
              />
            </LabeledIconField>

            <div className="grid gap-5 sm:grid-cols-2">
              <LabeledIconField
                id="phone"
                label="Teléfono (opcional)"
                icon={<Phone className="h-4.5 w-4.5" />}
              >
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  maxLength={20}
                  autoComplete="tel"
                  placeholder="55 1234 5678"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={fieldClassName}
                />
              </LabeledIconField>

              <LabeledIconField
                id="business-type"
                label="Categoría"
                icon={<Tag className="h-4.5 w-4.5" />}
              >
                <select
                  id="business-type"
                  name="business-type"
                  value={businessType}
                  onChange={(event) => setBusinessType(event.target.value)}
                  className={cn(fieldClassName, "appearance-none bg-white")}
                >
                  <option value="Panadería">Panadería</option>
                  <option value="Repostería">Repostería</option>
                  <option value="Conservas">Conservas / Salsas</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Artesanías">Artesanías</option>
                  <option value="Otros">Otros</option>
                </select>
              </LabeledIconField>
            </div>

            <PrimaryButton loading={isSubmitting} loadingLabel="Creando cuenta…">
              Crear cuenta
            </PrimaryButton>

            <p className="text-center text-[12px] leading-5 text-text-muted">
              Al crear tu cuenta aceptas los{" "}
              <Link to="/terminos" className="font-semibold text-primary hover:underline">
                Términos
              </Link>{" "}
              y el{" "}
              <Link to="/privacidad" className="font-semibold text-primary hover:underline">
                Aviso de privacidad
              </Link>
              .
            </p>
          </form>
        ) : null}

        {mode === "reset" && !resetSent ? (
          <form onSubmit={handleResetSubmit} className="space-y-5">
            <EmailField email={email} setEmail={setEmail} invalid={Boolean(errorMsg)} />
            <PrimaryButton loading={isSubmitting} loadingLabel="Enviando…">
              Enviar enlace
            </PrimaryButton>
          </form>
        ) : null}

        {mode === "reset" && resetSent ? (
          <StatusState
            icon={<MailCheck className="h-6 w-6" />}
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
              className="mt-7 h-12 w-full rounded-xl border border-[#dfe4e0] bg-white px-5 text-[14px] font-bold text-text-primary transition-colors hover:bg-[#f6f8f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Volver al inicio de sesión
            </button>
          </StatusState>
        ) : null}

        {isDemo ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] leading-5 text-amber-900">
            <strong className="block">Demostración local</strong>
            <span>Usa demo@artisan.app para explorar la aplicación.</span>
          </div>
        ) : null}
      </div>
    </AuthShell>
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
        Correo electrónico
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
        className="h-12 w-full rounded-xl border border-[#dfe4e0] bg-white px-4 text-[16px] text-text-primary outline-none transition-[border-color,box-shadow] placeholder:text-[#8b958f] focus:border-primary focus:ring-4 focus:ring-primary/10"
      />
    </div>
  );
}

function PrimaryButton({
  children,
  loading = false,
  disabled = false,
  loadingLabel = "Guardando…",
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  loadingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-bold text-white shadow-fab transition-[background-color,transform,box-shadow] hover:bg-[#1f5b41] hover:shadow-card-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
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
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-light text-primary">
        {icon}
      </div>
      <p className="mt-5 text-[14px] leading-6 text-text-secondary">{detail}</p>
      {children}
    </div>
  );
}

function LabeledIconField({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[13px] font-bold text-text-primary">
        {label}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        >
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

const fieldClassName =
  "h-12 w-full rounded-xl border border-[#dfe4e0] bg-white py-2 pl-11 pr-4 text-[16px] text-text-primary outline-none transition-[border-color,box-shadow] placeholder:text-[#8b958f] focus:border-primary focus:ring-4 focus:ring-primary/10";

function authCopy(mode: AuthMode, step: number, awaitingConfirmation: boolean, resetSent: boolean) {
  if (awaitingConfirmation) {
    return {
      title: "Confirma tu correo",
      description: "Tu cuenta está lista. Falta verificar que el correo te pertenece.",
    };
  }

  if (mode === "reset" && resetSent) {
    return {
      title: "Revisa tu correo",
      description: "Te enviamos las instrucciones para recuperar tu acceso.",
    };
  }

  if (mode === "reset") {
    return {
      title: "Recupera tu acceso",
      description: "Escribe tu correo y te enviaremos un enlace seguro.",
    };
  }

  if (mode === "signup") {
    return step === 1
      ? { title: "Crea tu cuenta", description: "Empieza con tus datos de acceso." }
      : { title: "Configura tu negocio", description: "Esta información personaliza tu espacio." };
  }

  return {
    title: "Vuelve a tu negocio",
    description: "Ingresa para continuar donde lo dejaste.",
  };
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
