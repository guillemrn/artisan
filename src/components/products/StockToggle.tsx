import { clsx } from "clsx";

/**
 * Interruptor general "Llevar inventario" (Ajustes). Apagado: se vende sin límite y no se descuenta stock.
 */
export function StockToggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-md border border-border p-3.5">
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-text-primary">Llevar inventario</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-text-muted">
          {checked
            ? "Cada venta descuenta piezas de tus productos. Si uno llega a 0, no se puede vender hasta que agregues más."
            : "Vendes sin límite y no se descuenta nada. Ideal si produces al día. Actívalo si quieres contar cuántas piezas te quedan."}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label="Llevar inventario"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50",
          checked ? "bg-text-primary" : "bg-border",
        )}
      >
        <span
          className={clsx(
            "absolute top-1 h-5 w-5 rounded-full bg-surface transition-[left] duration-200",
            checked ? "left-6" : "left-1",
          )}
        />
      </button>
    </label>
  );
}
