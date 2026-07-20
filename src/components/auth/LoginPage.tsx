import {
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  PackageCheck,
  ShieldCheck,
  Sparkles,
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
  const { signInWithGoogle, loading, isDemo } = useAuth();

  return (
    <main className="min-h-screen bg-[#F7F3EC] text-text-primary lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(560px,0.92fr)]">
      <section className="relative flex min-h-[38vh] overflow-hidden bg-[#243437] px-6 py-8 text-white sm:min-h-[42vh] sm:px-12 sm:py-10 lg:min-h-screen lg:px-16 xl:px-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(46,125,91,0.58),transparent_34%),radial-gradient(circle_at_88%_82%,rgba(201,120,74,0.24),transparent_35%),linear-gradient(145deg,#1F2B2E_0%,#164332_62%,#101819_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative z-10 flex w-full max-w-[640px] flex-col justify-between gap-12">
          <div>
            <Logo variant="full" className="h-12 w-auto brightness-0 invert sm:h-14" />

            <div className="mt-12 max-w-[560px] sm:mt-16 lg:mt-28">
              <h1 className="font-display text-[34px] font-bold leading-[1.05] tracking-normal sm:text-[56px] lg:text-[60px]">
                Gestión simple para tu <span className="text-[#C9784A]">negocio artesanal</span>
              </h1>
              <p className="mt-4 max-w-[520px] text-[16px] leading-relaxed text-white/78 sm:mt-6 sm:text-[20px]">
                Controla ventas, inventario y clientes con información clara para decidir mejor cada
                día.
              </p>
            </div>
          </div>

          <div className="hidden gap-3 sm:grid sm:max-w-[420px]">
            {[
              {
                icon: PackageCheck,
                title: "Inventario al día",
                text: "Existencias y productos siempre visibles.",
              },
              {
                icon: ChartNoAxesColumnIncreasing,
                title: "Ventas accionables",
                text: "Resumen rápido de utilidad, pedidos y producción.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 rounded-lg border border-white/14 bg-white/8 px-4 py-3 backdrop-blur"
              >
                <item.icon className="h-5 w-5 shrink-0 text-[#F7F3EC]" />
                <div>
                  <p className="text-[14px] font-semibold text-white">{item.title}</p>
                  <p className="text-[13px] text-white/62">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-[58vh] items-center justify-center bg-white px-6 py-12 sm:px-10 lg:min-h-screen">
        <div className="w-full max-w-[520px]">
          <div className="mb-10 lg:hidden">
            <Logo variant="full" className="h-11 w-auto" />
          </div>

          <div className="mb-9">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E8F5F0] px-3 py-1 text-[13px] font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Panel Artisan
            </p>
            <h2 className="font-display text-[34px] font-bold leading-tight text-[#2F3437] sm:text-[44px]">
              Bienvenido de nuevo
            </h2>
            <p className="mt-3 text-[18px] leading-relaxed text-text-secondary">
              Ingresa para gestionar ventas, productos e inventario.
            </p>
          </div>

          <button
            id="btn-google-signin"
            onClick={signInWithGoogle}
            disabled={loading}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-lg bg-primary px-5 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(46,125,91,0.22)] transition hover:bg-[#246448] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continuar con Google
          </button>

          {isDemo && (
            <div className="mt-5 rounded-lg border border-[#C9784A]/25 bg-[#C9784A]/10 px-4 py-3">
              <p className="text-[13px] font-bold text-[#9D5632]">Modo demo activo</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#9D5632]/78">
                Agrega tus credenciales Supabase en <code className="font-mono">.env</code> para
                habilitar el login real con Google.
              </p>
            </div>
          )}

          <div className="mt-8 grid gap-3 border-t border-border pt-6 text-[13px] text-text-secondary sm:grid-cols-2">
            {["Acceso seguro a tus datos", "Diseñado para productores en México"].map((text) => (
              <div key={text} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-2 text-[12px] text-text-muted">
            <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            <span>© {new Date().getFullYear()} Artisan. Tu negocio en buenas manos.</span>
          </div>
        </div>
      </section>
    </main>
  );
}
