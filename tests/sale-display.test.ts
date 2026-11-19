import assert from "node:assert/strict";
import test from "node:test";
import { saleItemsSummary, saleStatus } from "../src/lib/sale-display.ts";
import type { Sale } from "../src/lib/artisan-data.ts";

const base: Sale = {
  id: "s1",
  clientId: "c1",
  clientName: "Tienda Rio",
  channel: "PDV",
  items: [{ productId: "p1", productName: "Pan", qty: 2, unitPrice: 50, cost: 10 }],
  total: 100,
  cost: 20,
  profit: 80,
  payment: "Efectivo",
  status: "Entregado",
  createdAt: "2026-11-18T10:00:00.000Z",
};

test("maps sale states to one shared language", () => {
  assert.deepEqual(saleStatus(base), { label: "Cobrada", tone: "success" });
  assert.equal(
    saleStatus({ ...base, status: "Pendiente", payment: "Pendiente" }).label,
    "Por cobrar",
  );
  assert.deepEqual(saleStatus({ ...base, status: "Pendiente", payment: "Consignación" }), {
    label: "En consignación",
    tone: "info",
  });
  assert.equal(saleStatus({ ...base, payment: "Cortesía" }).label, "Cortesía");
  const onlyChange = {
    ...base,
    total: 0,
    items: [{ productId: "p1", productName: "Pan", qty: 0, returnQty: 2, unitPrice: 50, cost: 10 }],
  };
  assert.equal(saleStatus(onlyChange).label, "Solo cambio");
});

test("summarizes sold items and changes separately", () => {
  const sale = {
    ...base,
    items: [
      { productId: "p1", productName: "Pan", qty: 2, unitPrice: 50, cost: 10 },
      { productId: "p2", productName: "Salsa", qty: 0, returnQty: 1, unitPrice: 80, cost: 30 },
    ],
  };
  assert.deepEqual(saleItemsSummary(sale), { sold: "Pan ×2", changes: "Salsa ×1" });
});
