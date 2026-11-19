/** Datos del sistema: filas de desglose y métricas separadas por reglas (no tarjetas). */

export function LedgerRow({
  label,
  note,
  value,
  barPct,
  barClass,
  strong = false,
  muted = false,
}: {
  label: string;
  note?: string;
  value: string;
  barPct?: number;
  barClass?: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <tr className={strong ? "border-t-2 border-text-primary" : undefined}>
      <th
        scope="row"
        className={`py-2.5 pr-3 text-left text-[14px] md:text-[15px] ${
          strong ? "font-bold" : "font-medium"
        } ${muted ? "text-text-muted" : "text-text-primary"}`}
      >
        {label}
        {note && <span className="font-normal text-text-muted text-[13px]"> · {note}</span>}
      </th>
      <td className="hidden w-[42%] px-3 py-2.5 sm:table-cell" aria-hidden="true">
        {barPct !== undefined && barPct > 0 && (
          <div className={`h-2.5 ${barClass ?? ""}`} style={{ width: `${barPct}%` }} />
        )}
      </td>
      <td
        className={`py-2.5 text-right tabular-nums ${
          strong
            ? "text-[17px] font-black md:text-[19px]"
            : "text-[15px] font-semibold md:text-[17px]"
        } ${muted ? "text-text-muted" : "text-text-primary"}`}
      >
        {value}
      </td>
    </tr>
  );
}

export function Metric({
  label,
  value,
  unit,
  sub,
  tone = "neutral",
  onClick,
}: {
  label: string;
  value: string;
  unit?: string;
  sub: string;
  tone?: "neutral" | "success" | "warning";
  onClick?: () => void;
}) {
  const subColor =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-text-muted";
  const content = (
    <>
      <span className="text-[13px] text-text-muted">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="truncate font-display text-[24px] font-bold leading-tight tracking-[-0.01em] tabular-nums text-text-primary md:text-[28px]">
          {value}
        </span>
        {unit && <span className="text-[14px] font-semibold text-text-primary">{unit}</span>}
      </span>
      <span className={`truncate text-[13px] ${subColor} ${onClick ? "font-semibold" : ""}`}>
        {sub}
      </span>
    </>
  );
  const className =
    "flex min-w-0 flex-col gap-0.5 border-border py-4 pr-4 text-left [&:nth-child(even)]:border-l [&:nth-child(even)]:pl-4 lg:border-l lg:pl-5 lg:first:border-l-0 lg:first:pl-0 [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0";
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${className} transition hover:bg-surface-2`}
      >
        {content}
      </button>
    );
  }
  return <div className={className}>{content}</div>;
}
