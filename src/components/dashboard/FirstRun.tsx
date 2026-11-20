import { Link } from "@tanstack/react-router";
import { PlusIcon } from "@phosphor-icons/react";
import { buttonClass } from "@/components/ui/button-styles";
import { ResultBar } from "./ResultBar";

/**
 * Inicio de primer uso (sin ventas todavía): una sola acción, la primera venta.
 * No pide dar de alta productos ni clientes antes: eso se crea al vender.
 */
export function FirstRun({ firstName, dateLabel }: { firstName: string; dateLabel: string }) {
  return (
    <div className="page-shell space-y-10 md:px-0 md:pt-6">
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <section className="landing-in">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            {dateLabel} · Hola, {firstName}
          </p>
          <h1 className="mt-2 font-display text-[36px] font-black leading-[0.95] tracking-[-0.025em] text-text-primary md:text-[52px]">
            Registra tu
            <br />
            primera venta
          </h1>
          <p className="mt-4 max-w-[440px] text-[16px] leading-relaxed text-text-secondary">
            No tienes que dar de alta nada antes. Escribe qué vendiste, cuánto cobraste y listo.
          </p>
          <Link
            to="/nueva-venta"
            className={buttonClass({ variant: "cta", size: "lg", className: "mt-6 w-full sm:w-auto" })}
          >
            <PlusIcon className="h-5 w-5" weight="bold" />
            Nueva venta
          </Link>
        </section>

        <section
          aria-label="Así se verá tu inicio"
          className="landing-in landing-delay-1 self-start border-t-2 border-text-primary pt-4"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="font-display text-[17px] font-bold">Así verás tu día</p>
            <span className="rounded-sm bg-info-bg px-2 py-0.5 text-[12px] font-semibold text-info">
              Ejemplo
            </span>
          </div>
          <div aria-hidden className="pointer-events-none select-none opacity-70">
            <ResultBar collected={1000} cost={420} merma={0} salesCount={8} />
          </div>
          <p className="mt-4 text-[14px] text-text-secondary">
            Con cada venta, Grofit suma lo que cobraste, resta lo que te costó y te dice cuánto te
            queda.
          </p>
        </section>
      </div>
    </div>
  );
}
