import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, CheckIcon } from "@phosphor-icons/react";
import { clsx } from "clsx";
import { buttonClass } from "@/components/ui/button-styles";
import { ResultBar } from "./ResultBar";

type Step = {
  key: string;
  title: string;
  hint: string;
  to: "/productos" | "/clientes" | "/nueva-venta";
  cta: string;
  done: boolean;
};

/**
 * Dashboard de primer uso (sin ventas todavía): guía de 3 pasos + vista previa del resultado.
 * Reemplaza la pantalla llena de $0 por un camino claro a la primera venta.
 */
export function FirstRun({
  firstName,
  dateLabel,
  hasProducts,
  hasClients,
}: {
  firstName: string;
  dateLabel: string;
  hasProducts: boolean;
  hasClients: boolean;
}) {
  const steps: Step[] = [
    {
      key: "product",
      title: "Agrega lo que vendes",
      hint: "Nombre, costo y precio. El inventario es opcional.",
      to: "/productos",
      cta: "Agregar producto",
      done: hasProducts,
    },
    {
      key: "client",
      title: "Agrega a quién le vendes",
      hint: "Una tienda o una persona. También puedes hacerlo al vender.",
      to: "/clientes",
      cta: "Agregar cliente",
      done: hasClients,
    },
    {
      key: "sale",
      title: "Registra tu primera venta",
      hint: "Y mira cuánto te queda de cada peso.",
      to: "/nueva-venta",
      cta: "Registrar venta",
      done: false,
    },
  ];
  const current = steps.findIndex((s) => !s.done);
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="page-shell space-y-8 md:px-0 md:pt-6">
      <section className="landing-in">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          {dateLabel}
        </p>
        <h1 className="mt-1.5 font-display text-[34px] font-black leading-[0.95] tracking-[-0.025em] text-text-primary md:text-[48px]">
          Hola, {firstName}.
          <br />
          Vamos por tu primera venta.
        </h1>
      </section>

      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <section aria-label="Primeros pasos" className="landing-in landing-delay-1">
          <div className="flex items-center justify-between gap-4 border-t-2 border-text-primary pt-4">
            <p className="font-display text-[17px] font-bold">Primeros pasos</p>
            <p className="text-[13px] font-semibold text-text-muted tabular-nums">
              {doneCount} de {steps.length} listo{doneCount === 1 ? "" : "s"}
            </p>
          </div>
          <div className="mt-3 flex gap-1" aria-hidden>
            {steps.map((s) => (
              <span
                key={s.key}
                className={clsx(
                  "h-1.5 flex-1 transition-colors",
                  s.done ? "bg-cta" : "bg-border-soft",
                )}
              />
            ))}
          </div>

          <ol className="mt-4">
            {steps.map((s, i) => {
              const isCurrent = i === current;
              return (
                <li
                  key={s.key}
                  className={clsx(
                    "flex gap-4 border-b border-border-soft py-4",
                    !s.done && !isCurrent && "opacity-60",
                  )}
                >
                  <span
                    className={clsx(
                      "grid h-9 w-9 shrink-0 place-items-center font-display text-[15px] font-black",
                      s.done
                        ? "animate-nav-pop bg-cta text-cta-foreground"
                        : isCurrent
                          ? "bg-text-primary text-primary-foreground"
                          : "border border-border text-text-muted",
                    )}
                  >
                    {s.done ? <CheckIcon className="h-5 w-5" weight="bold" /> : i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={clsx(
                        "text-[16px] font-bold",
                        s.done && "text-text-muted line-through decoration-text-muted/50",
                      )}
                    >
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-[14px] text-text-muted">{s.hint}</p>
                    {isCurrent && (
                      <Link
                        to={s.to}
                        className={buttonClass({
                          variant: s.key === "sale" ? "cta" : "primary",
                          size: "md",
                          className: "group mt-3",
                        })}
                      >
                        {s.cta}
                        <ArrowRightIcon
                          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                          weight="bold"
                        />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {current !== steps.length - 1 && (
            <Link
              to="/nueva-venta"
              className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent-text hover:underline"
            >
              ¿Ya tienes todo? Registra una venta ahora
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )}
        </section>

        <section
          aria-label="Así se verá tu inicio"
          className="landing-in landing-delay-2 self-start border border-border p-5 md:p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="font-display text-[17px] font-bold">Así verás tu negocio</p>
            <span className="rounded-sm bg-info-bg px-2 py-0.5 text-[12px] font-semibold text-info">
              Ejemplo
            </span>
          </div>
          <div aria-hidden className="pointer-events-none select-none">
            <ResultBar collected={1000} cost={420} merma={0} salesCount={8} />
          </div>
          <p className="mt-5 border-t border-border-soft pt-4 text-[14px] text-text-secondary">
            Con cada venta, Artisan suma lo que cobraste, resta lo que te costó y te dice cuánto te
            queda. Sin hacer cuentas.
          </p>
        </section>
      </div>
    </div>
  );
}
