import { ArrowsClockwiseIcon } from "@phosphor-icons/react";
import { formatMXNc } from "@/lib/artisan-data";
import { SectionHeader } from "@/components/ui/section-header";

export type ClientReturns = {
  id: string;
  name: string;
  returnedUnits: number;
  mermaCost: number;
  soldAmount: number;
};

/** Widget: merma por cliente, en dinero (no mezcla paquetes con piezas). */
export function ReturnsByClient({ rows }: { rows: ClientReturns[] }) {
  return (
    <section className="flex flex-col gap-3 border-t-2 border-text-primary pt-4">
      <SectionHeader
        title="Dónde se te regresa producto"
        subtitle="Merma por cliente: dónde ajustar cuánto le dejas"
      />
      {rows.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-5 text-[14px] text-text-muted">
          <ArrowsClockwiseIcon className="h-5 w-5 shrink-0" />
          Nadie te regresó producto en este periodo.
        </p>
      ) : (
        <ul>
          {rows.map((r, i) => {
            const pct = r.soldAmount > 0 ? Math.round((r.mermaCost / r.soldAmount) * 100) : null;
            const tone =
              pct === null || pct >= 15
                ? "text-danger"
                : pct >= 5
                  ? "text-warning"
                  : "text-text-muted";
            return (
              <li
                key={r.id}
                className={`flex items-center gap-3 py-3 ${i > 0 ? "border-t border-border-soft" : ""}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{r.name}</span>
                  <span className="text-[13px] text-text-muted tabular-nums">
                    {r.returnedUnits} cambiados · merma {formatMXNc(r.mermaCost)}
                  </span>
                </span>
                <span className="text-right">
                  <span className={`block font-display text-[18px] font-bold tabular-nums ${tone}`}>
                    {pct === null ? "—" : `${pct}%`}
                  </span>
                  <span className="text-[12px] text-text-muted">de lo que le vendiste</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
