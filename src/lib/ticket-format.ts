import { formatMXN, formatMXNc, isWalkInClient, type Sale } from "./artisan-data.ts";

/** Estado de cobro que se imprime en el ticket (sello). */
export type TicketState = "paid" | "pending" | "consignment" | "courtesy";

export function ticketState(sale: Pick<Sale, "payment" | "status" | "paidAt">): TicketState {
  if (sale.payment === "Cortesía") return "courtesy";
  if (sale.payment === "Consignación") return "consignment";
  if (sale.payment === "Pendiente") return "pending";
  if (sale.status === "Pendiente" && !sale.paidAt) return "pending";
  return "paid";
}

export function formatTicketDate(iso: string) {
  const date = new Date(iso);
  const day = date
    .toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
    .replace(/\./g, "")
    .replace(/ de /g, " ");
  const time = date
    .toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })
    .replace(/\s*a\.\s*m\./i, " am")
    .replace(/\s*p\.\s*m\./i, " pm")
    .replace(/\u00a0/g, " ");
  return `${day} · ${time}`;
}

/** Folio corto para el cliente: "TAL-0412" → "0412". */
export function shortFolio(id: string) {
  return id.split("-").at(-1) ?? id;
}

export function paymentLine(sale: Sale, state: TicketState) {
  if (state === "courtesy") return "Sin cobro";
  if (state === "consignment") return "Consignación";
  if (state === "pending") return "Por cobrar";
  const paid = sale.paidAt ?? sale.createdAt;
  const day = new Date(paid)
    .toLocaleDateString("es-MX", { day: "numeric", month: "short" })
    .replace(/\./g, "");
  return `${sale.payment} · ${day}`;
}

/** Mensaje corto que acompaña la imagen en WhatsApp. */
export function ticketMessage(sale: Sale, businessName: string) {
  const state = ticketState(sale);
  const walkIn = isWalkInClient(sale.clientId);
  const greet = walkIn ? "¡Gracias por tu compra!" : `¡Gracias, ${sale.clientName}!`;
  const how =
    state === "paid"
      ? `, pagado en ${sale.payment.toLowerCase()}`
      : state === "courtesy"
        ? ", de cortesía"
        : " — queda pendiente de pago";
  return `${greet} Aquí está tu ticket de ${formatMXNc(sale.total)} (folio ${shortFolio(sale.id)})${how}. — ${businessName}`;
}

export type SavedMoment = {
  eyebrow: string;
  /** Texto sobre la cifra: "Esta venta te dejó" o "Cobraste". */
  label: string;
  amount: number;
  detail: string;
  firstSale: boolean;
  /** Algún producto vendido no tiene costo: invitar a capturarlo. */
  missingCost: boolean;
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Textos del momento "ajá" al guardar una venta. La cifra grande es lo que te dejó;
 * si ningún producto tiene costo, es lo cobrado (nunca una ganancia que no existe).
 * Con costo parcial, solo cuenta lo que sí tiene costo.
 */
export function savedMoment(
  sale: Sale,
  allSales: Sale[],
  now = new Date(),
  missingCostIds: ReadonlySet<string> = new Set(),
): SavedMoment {
  const others = allSales.filter((s) => s.id !== sale.id);
  const firstSale = others.length === 0;
  const state = ticketState(sale);
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const weekOthers = others.filter((s) => new Date(s.createdAt).getTime() >= weekAgo);
  const bestOfWeek =
    !firstSale && weekOthers.length >= 2 && weekOthers.every((s) => sale.profit > s.profit);

  const sold = sale.items.filter((item) => item.qty > 0);
  const withCost = sold.filter((item) => !missingCostIds.has(item.productId));
  const missingCost = withCost.length < sold.length;
  const noneHasCost = sold.length > 0 && withCost.length === 0;
  const knownProfit =
    state === "courtesy"
      ? sale.profit
      : withCost.reduce((sum, item) => sum + item.qty * (item.unitPrice - item.cost), 0);

  const eyebrow = firstSale
    ? "Tu primera venta en Grofit"
    : bestOfWeek && !missingCost
      ? "Tu mejor venta de la semana"
      : `Ticket ${shortFolio(sale.id)}`;

  const who = isWalkInClient(sale.clientId) ? "" : ` a ${sale.clientName}`;
  const pieces = sold.reduce((sum, item) => sum + item.qty, 0);
  const label = noneHasCost && state !== "courtesy" ? (state === "paid" ? "Cobraste" : "Vendiste") : "Esta venta te dejó";
  const amount = noneHasCost && state !== "courtesy" ? sale.total : missingCost ? knownProfit : sale.profit;

  let detail: string;
  if (state === "pending" || state === "consignment") {
    detail = `Te deben ${formatMXN(sale.total)} · lo verás en Por cobrar`;
  } else if (state === "courtesy") {
    detail = "Cortesía · no se cobró";
  } else if (noneHasCost) {
    detail = `${who ? `${who.trim()} · ` : ""}${pieces} ${pieces === 1 ? "pieza" : "piezas"}`;
  } else {
    const collectedToday = allSales
      .filter((s) => ticketState(s) === "paid" && sameDay(new Date(s.paidAt ?? s.createdAt), now))
      .reduce((sum, s) => sum + s.total, 0);
    const prefix = missingCost ? "de lo que tiene costo" : "de ganancia bruta";
    detail =
      firstSale || collectedToday <= sale.total
        ? `${prefix} · cobraste ${formatMXN(sale.total)}${who}`
        : `${prefix} · llevas ${formatMXN(collectedToday)} cobrados hoy`;
  }
  return { eyebrow, label, amount, detail, firstSale, missingCost };
}
