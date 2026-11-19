import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "@phosphor-icons/react";

import { Logo } from "@/components/ui/logo";

const BENEFITS = [
  "Registra ventas desde el celular",
  "Cobra lo pendiente sin perder notas",
  "Manda el ticket por WhatsApp",
];

/**
 * Login "con producto" (propuesta B): sigue vendiendo mientras te registras.
 * Escritorio: panel negro con el producto real a la izquierda y el formulario a la derecha.
 * Móvil: banda negra arriba con el titular (y el celular asomándose al crear cuenta).
 */
export function AuthShell({
  children,
  headline,
  showProductPeek = false,
}: {
  children: ReactNode;
  headline: ReactNode;
  showProductPeek?: boolean;
}) {
  return (
    <main className="min-h-dvh bg-surface text-text-primary lg:grid lg:grid-cols-[minmax(420px,1.1fr)_minmax(480px,1fr)]">
      {/* Panel de producto (escritorio) */}
      <aside className="relative hidden min-h-dvh overflow-hidden bg-rail px-12 py-10 text-rail-foreground lg:flex lg:flex-col xl:px-16">
        <Link to="/" aria-label="Ir al inicio de Grofit" className="relative z-10 w-fit">
          <Logo className="h-8 w-auto" />
        </Link>
        <div className="relative z-10 mt-16 max-w-[460px]">
          <p className="landing-in font-display text-[56px] font-black leading-[0.92] tracking-[-0.035em] xl:text-[64px]">
            Tus ventas,
            <br />
            <span className="text-cta">sin libreta.</span>
          </p>
          <ul className="landing-in landing-delay-1 mt-8 space-y-3 text-[16px] text-rail-muted">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="h-2 w-2 shrink-0 bg-cta" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <img
          src="/landing/dash-mobile.webp"
          alt=""
          aria-hidden
          width={780}
          height={1688}
          className="landing-phone absolute -bottom-32 right-12 w-[250px] rounded-[28px] border-[8px] border-rail-active xl:w-[280px]"
        />
        <img
          src="/landing/ticket.webp"
          alt=""
          aria-hidden
          width={636}
          height={1104}
          className="landing-ticket absolute bottom-10 right-[250px] w-[150px] bg-surface xl:right-[280px] xl:w-[170px]"
        />
      </aside>

      <section className="flex min-h-dvh min-w-0 flex-col">
        {/* Banda negra (móvil) */}
        <div className="relative overflow-hidden bg-rail px-5 pb-10 pt-5 text-rail-foreground lg:hidden">
          <Link to="/" aria-label="Ir al inicio de Grofit" className="relative z-10 block w-fit">
            <Logo className="h-7 w-auto" />
          </Link>
          <div
            className={`relative z-10 mt-5 font-display text-[32px] font-black leading-[0.95] tracking-[-0.03em] ${
              showProductPeek ? "max-w-[215px]" : ""
            }`}
          >
            {headline}
          </div>
          {showProductPeek && (
            <img
              src="/landing/dash-mobile.webp"
              alt=""
              aria-hidden
              width={780}
              height={1688}
              className="landing-phone absolute -right-10 top-14 w-[180px] -rotate-6 rounded-[18px] border-[6px] border-rail-active"
            />
          )}
        </div>

        {/* Volver (escritorio) */}
        <header className="hidden min-h-16 items-center justify-end px-12 lg:flex">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-[14px] font-semibold text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
            Volver al sitio
          </Link>
        </header>

        <div className="auth-shell-content relative -mt-4 flex flex-1 items-start rounded-t-2xl bg-surface px-5 pb-10 pt-5 sm:px-10 lg:mt-0 lg:items-center lg:rounded-none lg:px-14 lg:pt-0">
          <div className="mx-auto w-full max-w-[400px]">{children}</div>
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border-soft px-5 py-5 text-[12px] font-semibold text-text-muted sm:px-8 lg:justify-end lg:px-12">
          <Link to="/privacidad" className="transition-colors hover:text-text-primary">
            Privacidad
          </Link>
          <Link to="/terminos" className="transition-colors hover:text-text-primary">
            Términos
          </Link>
          <Link to="/cookies" className="transition-colors hover:text-text-primary">
            Cookies
          </Link>
          <span className="font-normal">© {new Date().getFullYear()} Grofit</span>
        </footer>
      </section>
    </main>
  );
}
