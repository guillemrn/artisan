import { Link } from "@tanstack/react-router";
import type React from "react";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/ui/logo";

export type LegalSection = {
  title: string;
  body: string[];
};

export function LegalPage({
  title,
  description,
  updatedAt,
  sections,
  children,
}: {
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f5f2ea] text-[#1d2723]">
      <header className="border-b border-[#1d2723]/10 bg-[#f5f2ea]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center" aria-label="Ir al inicio de Artisan">
            <Logo variant="full" className="h-8 w-auto" />
          </Link>
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#1d2723]/12 bg-white/72 px-4 text-sm font-bold text-[#1d2723] transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-[#245f44]">Legal</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-[#17231e] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-base leading-8 text-[#405047]">{description}</p>
          <p className="mt-4 text-sm font-semibold text-[#6f7a72]">
            Ultima actualizacion: {updatedAt}
          </p>
        </div>

        <div className="mt-10 grid gap-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-xl border border-[#1d2723]/10 bg-white p-5 sm:p-6"
            >
              <h2 className="text-xl font-black text-[#17231e]">{section.title}</h2>
              <div className="mt-4 grid gap-3 text-sm leading-7 text-[#405047] sm:text-base">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {children ? <div className="mt-6">{children}</div> : null}

        <footer className="mt-10 flex flex-col gap-3 border-t border-[#1d2723]/10 pt-6 text-sm text-[#536158] sm:flex-row sm:items-center sm:justify-between">
          <p>Estos textos son una base operativa y deben revisarse antes de produccion.</p>
          <div className="flex flex-wrap gap-4 font-semibold text-[#245f44]">
            <Link to="/privacidad" className="hover:underline">
              Privacidad
            </Link>
            <Link to="/terminos" className="hover:underline">
              Terminos
            </Link>
            <Link to="/cookies" className="hover:underline">
              Cookies
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
