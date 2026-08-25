import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/ui/logo";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-[#f1eee6] text-text-primary lg:grid lg:grid-cols-[minmax(390px,0.82fr)_minmax(560px,1.18fr)]">
      <aside className="relative hidden min-h-dvh overflow-hidden bg-[#173d2d] px-12 py-10 text-white lg:flex lg:flex-col xl:px-16 xl:py-12">
        <Link to="/" aria-label="Ir al inicio de Artisan" className="relative z-10 w-fit">
          <Logo variant="full" className="h-10 w-auto brightness-0 invert" />
        </Link>

        <div className="relative z-10 my-auto max-w-[500px] py-16">
          <h1 className="font-display text-[52px] font-bold leading-[1.04] text-white xl:text-[60px]">
            Ventas, pedidos y cobros sin perder el hilo.
          </h1>
          <p className="mt-7 max-w-[440px] text-[17px] leading-7 text-[#d7e4dc]">
            Vuelve a un espacio claro para llevar el trabajo diario de tu negocio.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-6 text-[13px] text-[#c6d8cd]">
          <span>Artisan</span>
          <span>Tu operación, en orden.</span>
        </div>

        <img
          src="/isotipo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-20 h-[360px] w-[360px] object-contain opacity-[0.07] brightness-0 invert"
        />
      </aside>

      <section className="flex min-h-dvh min-w-0 flex-col bg-white">
        <header className="flex min-h-20 items-center justify-between border-b border-border px-5 sm:px-8 lg:justify-end lg:px-12">
          <Link to="/" aria-label="Ir al inicio de Artisan" className="lg:hidden">
            <Logo variant="full" className="h-8 w-auto" />
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-[13px] font-semibold text-text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al sitio
          </Link>
        </header>

        <div className="auth-shell-content flex flex-1 items-start px-5 py-10 sm:px-10 sm:py-14 lg:items-center lg:px-14">
          <div className="mx-auto w-full max-w-[440px]">{children}</div>
        </div>

        <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-border px-5 py-5 text-[12px] font-semibold text-text-muted sm:px-8 lg:justify-end lg:px-12">
          <Link to="/privacidad" className="transition-colors hover:text-primary">
            Privacidad
          </Link>
          <Link to="/terminos" className="transition-colors hover:text-primary">
            Términos
          </Link>
          <Link to="/cookies" className="transition-colors hover:text-primary">
            Cookies
          </Link>
          <span className="font-normal">© {new Date().getFullYear()} Artisan</span>
        </footer>
      </section>
    </main>
  );
}
