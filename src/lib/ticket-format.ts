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

export type SavedMoment = { eyebrow: string; detail: string; firstSale: boolean };

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Textos del momento "ajá" al guardar una venta. El número grande siempre es lo que
 * te dejó; el encabezado y la línea de abajo cambian para que no se vuelva rutina.
 */
export function savedMoment(sale: Sale, allSales: Sale[], now = new Date()): SavedMoment {
  const others = allSales.filter((s) => s.id !== sale.id);
  const firstSale = others.length === 0;
  const state = ticketState(sale);
  const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const weekOthers = others.filter((s) => new Date(s.createdAt).getTime() >= weekAgo);
  const bestOfWeek =
    !firstSale && weekOthers.length >= 2 && weekOthers.every((s) => sale.profit > s.profit);

  const eyebrow = firstSale
    ? "Tu primera venta en Artisan"
    : bestOfWeek
      ? "Tu mejor venta de la semana"
      : `Ticket ${shortFolio(sale.id)}`;

  const who = isWalkInClient(sale.clientId) ? "" : ` a ${sale.clientName}`;
  let detail: string;
  if (state === "pending" || state === "consignment") {
    detail = `Te deben ${formatMXN(sale.total)} · lo verás en Por cobrar`;
  } else if (state === "courtesy") {
    detail = "Cortesía · no se cobró";
  } else {
    const collectedToday = allSales
      .filter((s) => ticketState(s) === "paid" && sameDay(new Date(s.paidAt ?? s.createdAt), now))
      .reduce((sum, s) => sum + s.total, 0);
    detail =
      firstSale || collectedToday <= sale.total
        ? `de ganancia bruta · cobraste ${formatMXN(sale.total)}${who}`
        : `de ganancia bruta · llevas ${formatMXN(collectedToday)} cobrados hoy`;
  }
  return { eyebrow, detail, firstSale };
}
