import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCostingItem,
  calculateProductCosting,
  type ProductCostingItem,
} from "../src/lib/product-costing.ts";

const proportional = (
  id: string,
  name: string,
  purchaseCost: number,
  purchaseQuantity: number,
  usageQuantity: number,
  unit: ProductCostingItem["purchaseUnit"],
): ProductCostingItem => ({
  id,
  name,
  category: "ingredient",
  mode: "proportional",
  purchaseCost,
  purchaseQuantity,
  purchaseUnit: unit,
  usageQuantity,
  usageUnit: unit,
});

test("calculates the Almara batch and package-of-four cost", () => {
  const items: ProductCostingItem[] = [
    proportional("1", "Harina", 37.4, 2000, 1350, "g"),
    proportional("2", "Aceite", 287, 2000, 90, "ml"),
    proportional("3", "Levadura", 33.9, 5, 2, "piece"),
    proportional("4", "Miel", 147, 1250, 30, "g"),
    proportional("5", "Sal", 21, 1000, 18, "g"),
    proportional("6", "Agua", 30, 20000, 750, "ml"),
    {
      id: "7",
      name: "Gas estimado",
      category: "production",
      mode: "fixed",
      purchaseCost: 10,
    },
    proportional("8", "Bolsa", 25, 100, 16, "piece"),
    proportional("9", "Hilo", 58, 10000, 480, "cm"),
    proportional("10", "Etiqueta", 115, 150, 16, "piece"),
    proportional("11", "Naranja", 30, 3, 3, "piece"),
    proportional("12", "Azúcar mascabado", 28.5, 500, 90, "g"),
  ];

  const result = calculateProductCosting(60, 4, items);

  assert.ok(Math.abs(result.batchCost - 120.9316666667) < 0.000001);
  assert.ok(Math.abs(result.unitCost - 2.0155277778) < 0.000001);
  assert.equal(result.productCost, 8.06);
});

test("converts compatible purchase and usage units", () => {
  const item: ProductCostingItem = {
    id: "flour",
    name: "Harina",
    category: "ingredient",
    mode: "proportional",
    purchaseCost: 37.4,
    purchaseQuantity: 2,
    purchaseUnit: "kg",
    usageQuantity: 1350,
    usageUnit: "g",
  };

  assert.equal(calculateCostingItem(item), 25.245);
});

test("rejects incompatible units", () => {
  assert.throws(() =>
    calculateCostingItem({
      id: "bad",
      name: "Insumo",
      category: "ingredient",
      mode: "proportional",
      purchaseCost: 10,
      purchaseQuantity: 1,
      purchaseUnit: "kg",
      usageQuantity: 1,
      usageUnit: "l",
    }),
  );
});
