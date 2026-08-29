import assert from "node:assert/strict";
import test from "node:test";
import { calculateSaleFinancials } from "../src/lib/artisan-sale-calculations.ts";
import type { SaleItem } from "../src/lib/artisan-data.ts";

const item: SaleItem = {
  productId: "product-1",
  productName: "Producto",
  qty: 10,
  returnQty: 1,
  unitPrice: 100,
  cost: 40,
};

test("a free replacement adds cost without reducing customer revenue", () => {
  assert.deepEqual(calculateSaleFinancials([item], "Efectivo"), {
    total: 1000,
    cost: 440,
    profit: 560,
    margin: 56,
  });
});

test("a standalone replacement records a loss and no new revenue", () => {
  assert.deepEqual(calculateSaleFinancials([{ ...item, qty: 0, returnQty: 1 }], "Efectivo"), {
    total: 0,
    cost: 40,
    profit: -40,
    margin: 0,
  });
});
