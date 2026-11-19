import { formatMXNc, isWalkInClient, type Sale } from "./artisan-data.ts";

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
