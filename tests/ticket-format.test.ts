import assert from "node:assert/strict";
import test from "node:test";
import { shortFolio, ticketMessage, ticketState } from "../src/lib/ticket-format.ts";
import { DEFERRED_PAYMENTS, WALK_IN_CLIENT_ID, isWalkInClient } from "../src/lib/artisan-data.ts";
import type { Sale } from "../src/lib/artisan-data.ts";

const base: Sale = {
  id: "TAL-0412",
  clientId: "almacen-norte",
  clientName: "Almacen Norte",
  channel: "PDV",
  items: [{ productId: "p1", productName: "Vela", qty: 3, unitPrice: 95, cost: 48 }],
  total: 285,
  cost: 144,
  profit: 141,
  payment: "Efectivo",
  status: "Entregado",
  createdAt: "2026-11-19T15:16:00.000Z",
};

test("folio corto toma el consecutivo", () => {
  assert.equal(shortFolio("TAL-0412"), "0412");
});

test("el sello refleja el estado de cobro", () => {
  assert.equal(ticketState(base), "paid");
  assert.equal(ticketState({ ...base, payment: "Pendiente", status: "Pendiente" }), "pending");
  assert.equal(ticketState({ ...base, payment: "Consignación", status: "Pendiente" }), "consignment");
  assert.equal(ticketState({ ...base, payment: "Cortesía" }), "courtesy");
});

test("mensaje de WhatsApp saluda al cliente o es genérico en mostrador", () => {
  assert.match(ticketMessage(base, "Taller Ámbar"), /^¡Gracias, Almacen Norte!.*folio 0412.*pagado en efectivo\. — Taller Ámbar$/);
  const walkIn = { ...base, clientId: WALK_IN_CLIENT_ID, clientName: "Público general" };
  assert.match(ticketMessage(walkIn, "Taller Ámbar"), /^¡Gracias por tu compra!/);
});

test("Público general no admite pagos diferidos", () => {
  assert.ok(isWalkInClient(WALK_IN_CLIENT_ID));
  assert.ok(!isWalkInClient("almacen-norte"));
  assert.deepEqual(DEFERRED_PAYMENTS, ["Pendiente", "Consignación"]);
});

test("momento ajá: primera venta, acumulado del día y mejor de la semana", async () => {
  const { savedMoment } = await import("../src/lib/ticket-format.ts");
  const now = new Date("2026-11-19T20:00:00.000Z");
  const s1 = { ...base, id: "TAL-0001", createdAt: "2026-11-19T16:00:00.000Z", profit: 50, total: 100 };
  assert.equal(savedMoment(s1, [s1], now).eyebrow, "Tu primera venta en Grofit");

  const s2 = { ...base, id: "TAL-0002", createdAt: "2026-11-19T17:00:00.000Z", profit: 40, total: 200 };
  const m2 = savedMoment(s2, [s2, s1], now);
  assert.equal(m2.eyebrow, "Ticket 0002");
  assert.match(m2.detail, /llevas \$300 cobrados hoy/);

  const s3 = { ...base, id: "TAL-0003", createdAt: "2026-11-19T18:00:00.000Z", profit: 90, total: 150 };
  assert.equal(savedMoment(s3, [s3, s2, s1], now).eyebrow, "Tu mejor venta de la semana");

  const owed = { ...s3, payment: "Pendiente" as const, status: "Pendiente" as const };
  assert.match(savedMoment(owed, [owed, s2, s1], now).detail, /^Te deben \$150 /);
});

test("momento ajá sin costo: muestra lo cobrado, nunca una ganancia falsa", async () => {
  const { savedMoment } = await import("../src/lib/ticket-format.ts");
  const now = new Date("2026-11-19T20:00:00.000Z");
  const quick = {
    ...base,
    id: "TAL-0001",
    createdAt: "2026-11-19T16:00:00.000Z",
    items: [
      { productId: "conchas", productName: "Conchas", qty: 10, unitPrice: 12, cost: 5 },
      { productId: "bolillo", productName: "Bolillo", qty: 6, unitPrice: 4, cost: 0 },
    ],
    total: 144,
    cost: 50,
    profit: 94,
  };
  const partial = savedMoment(quick, [quick], now, new Set(["bolillo"]));
  assert.equal(partial.amount, 70);
  assert.ok(partial.missingCost);
  assert.match(partial.detail, /^de lo que tiene costo/);

  const none = savedMoment(quick, [quick], now, new Set(["bolillo", "conchas"]));
  assert.equal(none.label, "Cobraste");
  assert.equal(none.amount, 144);
  assert.match(none.detail, /16 piezas/);
});
