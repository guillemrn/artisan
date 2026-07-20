import { useState } from "react";
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  ChevronLeft,
  Store,
  User as UserIcon,
  Phone,
  Tag,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/core/auth/auth-context";

// Google SVG icon (official brand colors)
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading, isDemo } = useAuth();

  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [signUpStep, setSignUpStep] = useState(1);

  // Form states
  const [email, setEmail] = useState(isDemo ? "demo@artisan.app" : "");
  const [password, setPassword] = useState(isDemo ? "123456" : "");
  const [showPassword, setShowPassword] = useState(false);

  // Onboarding states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Panadería");

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg("Por favor completa las credenciales.");
      return;
    }
    if (password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setSignUpStep(2);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const { error } = await signUpWithEmail(email, password, {
        full_name: fullName,
        phone: phone || undefined,
        business_name: businessName || "Mi Emprendimiento",
        business_type: businessType,
      });

      if (error) {
        setErrorMsg(error.message || "Error al crear la cuenta.");
      } else {
        setSuccessMsg(
          "¡Cuenta creada! Revisa tu correo de confirmación o inicia sesión."
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error en el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const { error } = await signInWithEmail(email, password);
      if (error) {
        setErrorMsg(error.message || "Credenciales incorrectas.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    // En modo demo simulamos éxito
    if (isDemo) {
      setTimeout(() => {
        setSuccessMsg("Enlace de restablecimiento enviado (Simulado en modo demo).");
        setIsSubmitting(false);
      }, 1000);
      return;
    }

    try {
      // Usar cliente de supabase directamente para restablecimiento
      const { error } = await signInWithEmail(email, "reset"); // fallback/placeholder o reset trigger
      // Nota: Supabase auth reset password
      const { supabase } = await import("@/core/supabase/client");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setErrorMsg(resetError.message);
      } else {
        setSuccessMsg("Se ha enviado un enlace para restablecer tu contraseña a tu correo.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al enviar el enlace.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F3EC] text-text-primary flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(46,125,91,0.06),transparent_30%),radial-gradient(circle_at_88%_82%,rgba(201,120,74,0.05),transparent_35%)] pointer-events-none" />

      <div className="w-full max-w-[480px] bg-white rounded-2xl border border-border p-8 md:p-10 shadow-[0_12px_40px_rgba(36,52,55,0.05)] relative z-10">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Logo variant="full" className="h-11 w-auto mb-6" />
          
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5F0] px-3 py-1 text-[12px] font-bold text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Panel Artisan
          </p>
          
          <h1 className="font-display text-[26px] font-bold text-[#2F3437] leading-tight">
            {mode === "login" && "Bienvenido de nuevo"}
            {mode === "signup" && (signUpStep === 1 ? "Comienza tu viaje" : "Cuéntanos de tu negocio")}
            {mode === "reset" && "¿Olvidaste tu contraseña?"}
          </h1>
          <p className="text-[14px] text-text-secondary mt-1.5">
            {mode === "login" && "Ingresa para gestionar ventas, productos e inventario."}
            {mode === "signup" && (signUpStep === 1 ? "Crea tu cuenta de Artisan gratis hoy." : "Personaliza tu inventario y catálogo.")}
            {mode === "reset" && "Ingresa tu correo y te enviaremos instrucciones de recuperación."}
          </p>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 text-[13px] text-green-700 font-medium">
            {successMsg}
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-[13px] text-red-600 font-medium">
            {errorMsg}
          </div>
        )}

        {/* LOGIN MODE */}
        {mode === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-text-primary mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="ejemplo@artisan.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[15px]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[13px] font-bold text-text-primary">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-[12px] font-semibold text-primary hover:underline"
                >
                  ¿La olvidaste?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-10 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-primary px-5 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(46,125,91,0.22)] transition hover:bg-[#246448] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>
        )}

        {/* SIGNUP MODE */}
        {mode === "signup" && (
          <div className="space-y-4">
            {signUpStep === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-4">
                <div>
                  <label className="block text-[13px] font-bold text-text-primary mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@artisan.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[15px]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-text-primary mb-1.5">
                    Contraseña (mínimo 6 caracteres)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 pl-3.5 pr-10 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[15px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-primary px-5 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(46,125,91,0.22)] transition hover:bg-[#246448] active:scale-[0.99]"
                >
                  Continuar
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setSignUpStep(1)}
                  className="inline-flex items-center gap-1 text-[12px] text-text-secondary font-semibold hover:text-primary mb-2"
                >
                  <ChevronLeft className="h-4 w-4" /> Volver a credenciales
                </button>

                <div>
                  <label className="block text-[13px] font-bold text-text-primary mb-1.5">
                    Tu Nombre Completo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="ej. María López"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[15px]"
                    />
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted h-4.5 w-4.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-text-primary mb-1.5">
                    Nombre del Negocio / Emprendimiento
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="ej. Pan Pita Artesanal"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[15px]"
                    />
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted h-4.5 w-4.5" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-text-primary mb-1.5">
                      Teléfono (Opcional)
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="5512345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[15px]"
                      />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted h-4.5 w-4.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-text-primary mb-1.5">
                      Categoría
                    </label>
                    <div className="relative">
                      <select
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                        className="w-full h-11 pl-10 pr-3.5 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[15px] bg-white appearance-none"
                      >
                        <option value="Panadería">Panadería</option>
                        <option value="Repostería">Repostería</option>
                        <option value="Conservas">Conservas / Salsas</option>
                        <option value="Bebidas">Bebidas</option>
                        <option value="Artesanías">Artesanías</option>
                        <option value="Otros">Otros</option>
                      </select>
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted h-4.5 w-4.5" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-primary px-5 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(46,125,91,0.22)] transition hover:bg-[#246448] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    "Crear cuenta e ingresar"
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* PASSWORD RESET MODE */}
        {mode === "reset" && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-text-primary mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                placeholder="ejemplo@artisan.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[15px]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-primary px-5 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(46,125,91,0.22)] transition hover:bg-[#246448] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              ) : (
                "Enviar enlace"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="w-full text-center text-[13px] font-semibold text-text-secondary hover:text-primary mt-2"
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {/* Footer controls & Switcher */}
        {mode !== "reset" && (
          <div className="mt-6 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setSignUpStep(1);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              {mode === "login" ? "¿No tienes cuenta? Regístrate gratis" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>

            {/* 
            <div className="relative w-full flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-4 text-text-muted text-[12px]">o continuar con</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <button
              id="btn-google-signin"
              onClick={signInWithGoogle}
              disabled={loading || isSubmitting}
              className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-border bg-white px-5 text-[14px] font-bold text-text-primary transition hover:bg-gray-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              Google
            </button>
            */}
          </div>
        )}

        {/* Demo Mode Reminder */}
        {isDemo && (
          <div className="mt-5 rounded-lg border border-[#C9784A]/25 bg-[#C9784A]/10 px-4 py-3">
            <p className="text-[13px] font-bold text-[#9D5632]">Modo demo activo</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#9D5632]/78">
              Agrega tus credenciales Supabase en <code className="font-mono">.env</code> para habilitar el acceso real.
              Para probar el demo usa: <code className="font-mono">demo@artisan.app</code>
            </p>
          </div>
        )}

        {/* Trust Badges */}
        <div className="mt-8 grid gap-3 border-t border-border pt-6 text-[13px] text-text-secondary sm:grid-cols-2">
          {["Acceso seguro a tus datos", "Diseñado para productores"].map((text) => (
            <div key={text} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <span>{text}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[12px] text-text-muted">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <span>© {new Date().getFullYear()} Artisan. Tu negocio en buenas manos.</span>
        </div>

      </div>
    </main>
  );
}


