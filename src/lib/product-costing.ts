export type CostingCategory = "ingredient" | "packaging" | "production";
export type CostingMode = "proportional" | "fixed";
export type CostingUnit = "g" | "kg" | "ml" | "l" | "piece" | "cm" | "m";

export type ProductCostingItem = {
  id: string;
  name: string;
  category: CostingCategory;
  mode: CostingMode;
  purchaseCost: number;
  purchaseQuantity?: number;
  purchaseUnit?: CostingUnit;
  usageQuantity?: number;
  usageUnit?: CostingUnit;
};

export type ProductCosting = {
  yieldQuantity: number;
  unitsPerProduct: number;
  items: ProductCostingItem[];
  batchCost: number;
  unitCost: number;
  productCost: number;
};

type UnitDefinition = {
  dimension: "mass" | "volume" | "count" | "length";
  factor: number;
};

const UNIT_DEFINITIONS: Record<CostingUnit, UnitDefinition> = {
  g: { dimension: "mass", factor: 1 },
  kg: { dimension: "mass", factor: 1000 },
  ml: { dimension: "volume", factor: 1 },
  l: { dimension: "volume", factor: 1000 },
  piece: { dimension: "count", factor: 1 },
  cm: { dimension: "length", factor: 1 },
  m: { dimension: "length", factor: 100 },
};

export const COSTING_UNIT_LABELS: Record<CostingUnit, string> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "L",
  piece: "pzas",
  cm: "cm",
  m: "m",
};

export const COSTING_CATEGORY_LABELS: Record<CostingCategory, string> = {
  ingredient: "Ingrediente",
  packaging: "Empaque",
  production: "Producción",
};

export const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateCostingItem(item: ProductCostingItem): number {
  if (!Number.isFinite(item.purchaseCost) || item.purchaseCost < 0) {
    throw new Error(`El costo de ${item.name || "un insumo"} no es válido.`);
  }

  if (item.mode === "fixed") return item.purchaseCost;

  const purchaseQuantity = item.purchaseQuantity ?? 0;
  const usageQuantity = item.usageQuantity ?? 0;
  if (purchaseQuantity <= 0 || usageQuantity < 0 || !item.purchaseUnit || !item.usageUnit) {
    throw new Error(`Completa las cantidades de ${item.name || "un insumo"}.`);
  }

  const purchaseDefinition = UNIT_DEFINITIONS[item.purchaseUnit];
  const usageDefinition = UNIT_DEFINITIONS[item.usageUnit];
  if (purchaseDefinition.dimension !== usageDefinition.dimension) {
    throw new Error(`Las unidades de compra y uso de ${item.name || "un insumo"} no coinciden.`);
  }

  const purchasedBase = purchaseQuantity * purchaseDefinition.factor;
  const usedBase = usageQuantity * usageDefinition.factor;
  return item.purchaseCost * (usedBase / purchasedBase);
}

export function calculateProductCosting(
  yieldQuantity: number,
  unitsPerProduct: number,
  items: ProductCostingItem[],
): ProductCosting {
  if (!Number.isFinite(yieldQuantity) || yieldQuantity <= 0) {
    throw new Error("El rendimiento del lote debe ser mayor a cero.");
  }
  if (!Number.isFinite(unitsPerProduct) || unitsPerProduct <= 0) {
    throw new Error("La presentación vendida debe incluir al menos una unidad.");
  }
  if (unitsPerProduct > yieldQuantity) {
    throw new Error("La presentación no puede contener más unidades que las que produce el lote.");
  }
  if (items.length === 0) {
    throw new Error("Agrega al menos un insumo o gasto al costeo.");
  }

  const batchCost = items.reduce((total, item) => total + calculateCostingItem(item), 0);
  const unitCost = batchCost / yieldQuantity;
  const productCost = unitCost * unitsPerProduct;

  return {
    yieldQuantity,
    unitsPerProduct,
    items,
    batchCost,
    unitCost,
    productCost: roundCurrency(productCost),
  };
}

export function compatibleUnits(unit: CostingUnit): CostingUnit[] {
  const dimension = UNIT_DEFINITIONS[unit].dimension;
  return (Object.keys(UNIT_DEFINITIONS) as CostingUnit[]).filter(
    (candidate) => UNIT_DEFINITIONS[candidate].dimension === dimension,
  );
}
