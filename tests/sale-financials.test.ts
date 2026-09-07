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

test("a free replacement is reported separately from sale profit", () => {
  assert.deepEqual(calculateSaleFinancials([item], "Efectivo"), {
    total: 1000,
    cost: 400,
    mermaCost: 40,
    profit: 600,
    margin: 60,
  });
});

test("a standalone replacement has no sale profit and retains its merma cost", () => {
  assert.deepEqual(calculateSaleFinancials([{ ...item, qty: 0, returnQty: 1 }], "Efectivo"), {
    total: 0,
    cost: 0,
    mermaCost: 40,
    profit: 0,
    margin: 0,
  });
});
