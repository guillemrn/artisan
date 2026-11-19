import { clsx } from "clsx";
import { formatMXNc } from "@/lib/artisan-data";

type Segment = { key: string; label: string; value: number; share: number; swatch: string };

/**
 * Zona de resultado (opción A): todo lo cobrado en una sola barra.
 * Gris = costo de venta · rayado = merma · naranja = lo que te queda.
 */
export function ResultBar({
  collected,
  cost,
  merma,
  salesCount,
}: {
  collected: number;
  cost: number;
  merma: number;
  salesCount: number;
}) {
  if (collected <= 0) {
    return (
      <div className="flex h-full min-h-[140px] items-center rounded-lg bg-surface-2 px-5 text-[14px] text-text-muted">
        Sin ventas cobradas en el periodo. Cuando cobres, aquí verás cuánto te queda de cada peso.
      </div>
    );
  }

  const gross = collected - cost;
  const keeps = gross - merma;
  // Si los costos superan lo cobrado, la barra se escala a los costos.
  const base = Math.max(collected, cost + merma);
  const share = (n: number) => Math.max(0, (n / base) * 100);
  const pctOfCollected = (n: number) => `${Math.round((n / collected) * 100)}%`;

  const segments: Segment[] = [
    {
      key: "cost",
      label: "Costo de venta",
      value: -cost,
      share: share(cost),
      swatch: "bg-text-muted",
    },
  ];
  if (merma > 0) {
    segments.push({
      key: "merma",
      label: "Merma por cambios",
      value: -merma,
      share: share(merma),
      swatch: "bg-hatch",
    });
  }
  segments.push({
    key: "keeps",
    label: merma > 0 ? "Te queda" : "Ganancia bruta",
    value: keeps,
    share: share(keeps),
    swatch: "bg-cta",
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-primary">
          De lo que cobraste, ¿cuánto te queda?
        </p>
        <p className="text-[13px] text-text-muted tabular-nums">
          Cobraste {formatMXNc(collected)} · {salesCount} {salesCount === 1 ? "venta" : "ventas"}
        </p>
      </div>

      <div
        className="animate-bar-in flex h-7 gap-0.5 md:h-8"
        role="img"
        aria-label={segments.map((s) => `${s.label} ${formatMXNc(s.value)}`).join(", ")}
      >
        {segments
          .filter((s) => s.share > 0)
          .map((s) => (
            <span key={s.key} className={s.swatch} style={{ flex: s.share }} />
          ))}
      </div>

      <dl
        className={clsx(
          "grid gap-y-3 sm:gap-x-0",
          segments.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
        )}
      >
        {segments.map((s, i) => {
          const isKeep = s.key === "keeps";
          return (
            <div
              key={s.key}
              className={clsx(
                "flex items-baseline justify-between gap-3 border-t border-border-soft pt-3 sm:flex-col sm:items-start sm:justify-start sm:gap-1 sm:border-t-0 sm:pt-0",
                i > 0 && "sm:border-l sm:border-border sm:pl-4",
              )}
            >
              <dt className="flex items-center gap-2 text-[13px] text-text-secondary">
                <span className={clsx("h-3 w-3 shrink-0", s.swatch)} aria-hidden />
                {s.label}
                {!(isKeep && merma <= 0) && (
                  <span className="text-text-muted">· {pctOfCollected(Math.abs(s.value))}</span>
                )}
              </dt>
              <dd
                className={clsx(
                  "font-display tabular-nums",
                  isKeep
                    ? "text-[22px] font-black md:text-[24px]"
                    : "text-[18px] font-bold md:text-[20px]",
                  isKeep && s.value < 0 ? "text-danger" : "text-text-primary",
                )}
              >
                {isKeep && merma <= 0
                  ? // Sin merma, el monto ya es el número grande del dashboard: aquí solo el margen.
                    pctOfCollected(Math.abs(s.value))
                  : s.value < 0
                    ? `−${formatMXNc(Math.abs(s.value))}`
                    : formatMXNc(s.value)}
              </dd>
            </div>
          );
        })}
      </dl>

      {merma > 0 && (
        <p className="text-[13px] text-text-muted">
          “Te queda” es tu ganancia bruta menos la merma.
        </p>
      )}
    </div>
  );
}
