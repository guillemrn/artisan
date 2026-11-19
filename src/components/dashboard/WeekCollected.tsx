import { formatMXN, formatMXNc } from "@/lib/artisan-data";
import { SectionHeader } from "@/components/ui/section-header";
import { useCountUp } from "@/lib/use-count-up";

export type WeekDay = { label: string; amount: number; isToday: boolean; isFuture: boolean };

/**
 * Widget: cobrado esta semana. Solo compara contra los MISMOS días de la semana pasada
 * (lunes a hoy), nunca contra la semana completa.
 */
export function WeekCollected({
  days,
  total,
  lastWeekSameDays,
  todayLabel,
}: {
  days: WeekDay[];
  total: number;
  lastWeekSameDays: number;
  todayLabel: string;
}) {
  const animated = useCountUp(total);
  const max = Math.max(1, ...days.map((d) => d.amount));
  const delta = total - lastWeekSameDays;
  const rangeLabel = todayLabel === "lunes" ? "el lunes pasado" : `lunes a ${todayLabel} pasados`;

  return (
    <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
      <SectionHeader
        title="Cobrado esta semana"
        subtitle="Contra los mismos días de la semana pasada"
      />
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-[32px] font-black leading-none tracking-[-0.02em] tabular-nums">
          {formatMXN(animated)}
        </span>
        {lastWeekSameDays > 0 ? (
          <span className={`text-[13px] font-bold ${delta >= 0 ? "text-success" : "text-warning"}`}>
            {delta >= 0 ? "+" : "−"}
            {formatMXN(Math.abs(delta))} vs. {rangeLabel}
          </span>
        ) : (
          <span className="text-[13px] text-text-muted">Sin cobros esos días la semana pasada</span>
        )}
      </div>
      <div className="grid h-[88px] grid-cols-7 items-end gap-1.5" aria-hidden>
        {days.map((d) => (
          <span
            key={d.label}
            title={d.isFuture ? undefined : formatMXNc(d.amount)}
            className={`animate-grow-up origin-bottom ${
              d.isFuture ? "bg-border-soft" : d.isToday ? "bg-cta" : "bg-text-primary"
            }`}
            style={{
              height:
                d.isFuture || d.amount <= 0 ? "3px" : `${Math.max(6, (d.amount / max) * 100)}%`,
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] text-text-muted">
        {days.map((d) => (
          <span key={d.label} className={d.isToday ? "font-bold text-text-primary" : undefined}>
            {d.label}
          </span>
        ))}
      </div>
    </section>
  );
}
