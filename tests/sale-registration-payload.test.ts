import assert from "node:assert/strict";
import test from "node:test";
import { buildRegisterSalePayload } from "../src/lib/artisan-sale-registration.ts";
import type { Sale } from "../src/lib/artisan-data.ts";

const sale: Sale = {
  id: "sale-1",
  clientId: "client-1",
  clientName: "Nombre manipulable",
  channel: "PDV",
  items: [
    {
      productId: "product-1",
      productName: "Producto manipulado",
      qty: 2,
      returnQty: 1,
      unitPrice: 1,
      cost: 0,
    },
  ],
  total: 2,
  cost: 0,
  profit: 2,
  payment: "Efectivo",
  status: "Entregado",
  createdAt: "2026-08-29T10:00:00.000Z",
  priceMode: "public",
};

test("registration payload excludes every browser-calculated financial field", () => {
  assert.deepEqual(buildRegisterSalePayload(sale), {
    p_sale_id: "sale-1",
    p_client_id: "client-1",
    p_items: [{ productId: "product-1", qty: 2, returnQty: 1 }],
    p_price_mode: "public",
    p_payment: "Efectivo",
  });
});

test("registration requires an explicit price mode", () => {
  assert.throws(() => buildRegisterSalePayload({ ...sale, priceMode: undefined }));
});
