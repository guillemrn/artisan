import { useEffect, useRef, useState } from "react";
import { CalendarBlankIcon, CaretDownIcon } from "@phosphor-icons/react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/button";
import { formatRange, presetRange, toISODate, type DateRange } from "@/lib/date-range";

export type PeriodKey = "Hoy" | "Semana" | "Mes" | "Año" | "Todo" | "Rango";

const QUICK: [Exclude<PeriodKey, "Rango">, string][] = [
  ["Hoy", "Hoy"],
  ["Semana", "Semana"],
  ["Mes", "Mes"],
  ["Año", "Año"],
  ["Todo", "Todo"],
];

const PRESETS: [Parameters<typeof presetRange>[0], string][] = [
  ["7d", "Últimos 7 días"],
  ["30d", "Últimos 30 días"],
  ["lastMonth", "Mes pasado"],
];

/**
 * Periodo del dashboard: atajos visibles (Hoy · Semana · Mes · Año · Todo) + rango de fechas.
 * En móvil los atajos se deslizan; el rango abre una hoja sobre la barra de navegación.
 */
export function PeriodPicker({
  value,
  range,
  onChange,
}: {
  value: PeriodKey;
  range: DateRange | null;
  onChange: (value: PeriodKey, range?: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const today = toISODate(new Date());
  const [draft, setDraft] = useState<DateRange>(range ?? presetRange("7d"));
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // En móvil los atajos se deslizan: mantén visible el periodo activo.
  const groupRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const active = groupRef.current?.querySelector<HTMLElement>('[aria-checked="true"]');
    active?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [value, range]);

  const invalid = !draft.from || !draft.to || draft.from > draft.to;

  const chip = (active: boolean) =>
    clsx(
      "inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap px-3.5 text-[14px] transition-colors duration-150",
      active
        ? "bg-text-primary font-bold text-primary-foreground"
        : "font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary",
    );

  return (
    <div ref={ref} className="relative min-w-0">
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Periodo"
        className="flex overflow-x-auto rounded-md border border-border bg-surface [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {QUICK.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            onClick={() => {
              setOpen(false);
              onChange(key);
            }}
            className={chip(value === key)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={value === "Rango"}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setDraft(range ?? presetRange("7d"));
            setOpen((o) => !o);
          }}
          className={clsx(chip(value === "Rango"), "border-l border-border")}
        >
          <CalendarBlankIcon className="h-4 w-4" weight={value === "Rango" ? "bold" : "regular"} />
          {value === "Rango" && range ? formatRange(range) : "Rango"}
          <CaretDownIcon
            className={clsx("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Elegir rango de fechas"
          className="animate-nav-pop fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 rounded-lg border border-text-primary bg-surface p-4 shadow-[0_12px_32px_-8px_rgba(17,17,17,0.25)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:mt-2 sm:w-[360px]"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Rango de fechas
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDraft(presetRange(key))}
                className="h-9 rounded-md border border-border px-3 text-[13px] font-semibold transition hover:border-text-primary active:scale-[0.97]"
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(["from", "to"] as const).map((k) => (
              <label key={k} className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold">
                  {k === "from" ? "Desde" : "Hasta"}
                </span>
                <input
                  type="date"
                  value={draft[k]}
                  max={today}
                  onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                  className="form-input h-11 px-3 tabular-nums"
                />
              </label>
            ))}
          </div>
          {invalid && draft.from && draft.to && (
            <p className="mt-2 text-[13px] font-semibold text-danger">
              “Desde” tiene que ser antes de “Hasta”.
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              block
              disabled={invalid}
              onClick={() => {
                onChange("Rango", draft);
                setOpen(false);
              }}
            >
              Ver {invalid ? "rango" : formatRange(draft)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
