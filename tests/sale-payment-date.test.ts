import assert from "node:assert/strict";
import test from "node:test";
import { getSalePaymentDate, type Sale } from "../src/lib/artisan-data.ts";

const pendingSale: Sale = {
  id: "sale-1",
  clientId: "client-1",
  clientName: "Cliente",
  channel: "PDV",
  items: [],
  total: 100,
  cost: 40,
  profit: 60,
  payment: "Pendiente",
  status: "Pendiente",
  createdAt: "2026-08-25T10:00:00.000Z",
};

test("a pending sale has no payment date", () => {
  assert.equal(getSalePaymentDate(pendingSale), undefined);
});

test("an existing settled sale falls back to its original date", () => {
  assert.equal(
    getSalePaymentDate({ ...pendingSale, status: "Entregado", payment: "Efectivo" }),
    pendingSale.createdAt,
  );
});

test("a later payment date does not replace the delivery date", () => {
  const paidAt = "2026-08-27T15:30:00.000Z";
  const sale = {
    ...pendingSale,
    status: "Entregado" as const,
    payment: "Transferencia" as const,
    paidAt,
  };

  assert.equal(getSalePaymentDate(sale), paidAt);
  assert.equal(sale.createdAt, pendingSale.createdAt);
});
