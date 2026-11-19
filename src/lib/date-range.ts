/** Rango de fechas del dashboard en formato local YYYY-MM-DD (inclusivo). */
export type DateRange = { from: string; to: string };

export function toISODate(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Fecha local a las 00:00 (evita el desfase UTC de `new Date("YYYY-MM-DD")`). */
export function parseISODate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function isInRange(timestamp: number, range: DateRange) {
  const start = parseISODate(range.from).getTime();
  const end = parseISODate(range.to);
  end.setDate(end.getDate() + 1);
  return timestamp >= start && timestamp < end.getTime();
}

const short = (d: Date) => d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });

/** "12 – 18 nov", "28 oct – 3 nov" o "18 nov" */
export function formatRange(range: DateRange) {
  const a = parseISODate(range.from);
  const b = parseISODate(range.to);
  if (range.from === range.to) return short(a);
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()} – ${short(b)}`;
  }
  return `${short(a)} – ${short(b)}`;
}

export function presetRange(preset: "7d" | "30d" | "lastMonth"): DateRange {
  const today = new Date();
  if (preset === "lastMonth") {
    const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const last = new Date(today.getFullYear(), today.getMonth(), 0);
    return { from: toISODate(first), to: toISODate(last) };
  }
  const days = preset === "7d" ? 6 : 29;
  const from = new Date(today);
  from.setDate(today.getDate() - days);
  return { from: toISODate(from), to: toISODate(today) };
}
