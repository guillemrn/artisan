import type { Sale } from "./artisan-data";
import type { BadgeTone } from "@/components/ui/badge";

/** Estado visible de una venta: mismo lenguaje en toda la app. */
export function saleStatus(sale: Sale): { label: string; tone: BadgeTone } {
  const sold = sale.items.some((i) => i.qty > 0);
  const onlyChanges = !sold && sale.items.some((i) => (i.returnQty ?? 0) > 0);
  if (onlyChanges) return { label: "Solo cambio", tone: "neutral" };
  if (sale.status === "Pendiente") {
    return sale.payment === "Consignación"
      ? { label: "En consignación", tone: "info" }
      : { label: "Por cobrar", tone: "warning" };
  }
  if (sale.payment === "Cortesía") return { label: "Cortesía", tone: "neutral" };
  return { label: "Cobrada", tone: "success" };
}

export function isCollectable(sale: Sale) {
  return sale.status === "Pendiente";
}

const dayMonth = (d: Date) =>
  d.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).replace(".", "");
const time = (d: Date) => d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

/** Fecha principal (cobro si ya se cobró, si no la entrega) y la entrega cuando difiere. */
export function saleDates(sale: Sale) {
  // Igual que getSaleDashboardDate: fecha de cobro si existe; si no, la de entrega.
  const main = new Date(sale.paidAt ?? sale.createdAt);
  const delivered = new Date(sale.createdAt);
  const paidLater = Boolean(sale.paidAt && sale.paidAt !== sale.createdAt);
  return {
    day: dayMonth(main),
    time: time(main),
    deliveredLabel: paidLater ? `Entrega ${dayMonth(delivered)}` : null,
  };
}

/** "Vela Ambar ×3, Jabones ×2" y aparte los cambios. */
export function saleItemsSummary(sale: Sale) {
  const sold = sale.items.filter((i) => i.qty > 0).map((i) => `${i.productName} ×${i.qty}`);
  const changes = sale.items
    .filter((i) => (i.returnQty ?? 0) > 0)
    .map((i) => `${i.productName} ×${i.returnQty}`);
  return { sold: sold.join(", "), changes: changes.join(", ") };
}

export const channelLabel = (channel: Sale["channel"]) =>
  channel === "PDV" ? "Punto de venta" : "Público";
