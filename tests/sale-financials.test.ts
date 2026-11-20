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

test("al poner el costo a un producto vendido sin costo, sus ventas se recalculan", async () => {
  const { applyCostToSales } = await import("../src/lib/artisan-sale-calculations.ts");
  const sales = [
    { id: "a", total: 144, cost: 50, profit: 94, items: [
      { productId: "conchas", productName: "Conchas", qty: 10, unitPrice: 12, cost: 5 },
      { productId: "bolillo", productName: "Bolillo", qty: 6, unitPrice: 4, cost: 0 },
    ] },
    { id: "b", total: 95, cost: 48, profit: 47, items: [
      { productId: "vela", productName: "Vela", qty: 1, unitPrice: 95, cost: 48 },
    ] },
  ];
  const changed = applyCostToSales(sales, "bolillo", 1.5);
  assert.equal(changed.length, 1);
  assert.equal(changed[0].cost, 59);
  assert.equal(changed[0].profit, 85);
});
