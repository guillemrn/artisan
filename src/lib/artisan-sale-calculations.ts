import type { PaymentMethod, SaleItem } from "./artisan-data";

export function getSaleItemRevenue(item: SaleItem, payment: PaymentMethod): number {
  return payment === "Cortesía" ? 0 : item.qty * item.unitPrice;
}

export function getSaleItemCost(item: SaleItem): number {
  return item.qty * item.cost;
}

export function getSaleItemMermaCost(item: SaleItem): number {
  return (item.returnQty ?? 0) * item.cost;
}

export function calculateSaleFinancials(items: SaleItem[], payment: PaymentMethod) {
  const total = items.reduce((sum, item) => sum + getSaleItemRevenue(item, payment), 0);
  const cost = items.reduce((sum, item) => sum + getSaleItemCost(item), 0);
  const mermaCost = items.reduce((sum, item) => sum + getSaleItemMermaCost(item), 0);
  const profit = total - cost;
  const margin = total > 0 ? Math.round((profit / total) * 100) : 0;

  return { total, cost, mermaCost, profit, margin };
}

/**
 * Cuando un producto creado sin costo recibe su costo, las ventas que ya lo tenían
 * (con costo 0) se recalculan para que el inicio muestre la ganancia real.
 * Devuelve solo las ventas que cambiaron.
 */
export function applyCostToSales<T extends { items: SaleItem[]; total: number; cost: number; profit: number }>(
  sales: T[],
  productId: string,
  unitCost: number,
): T[] {
  const changed: T[] = [];
  for (const sale of sales) {
    if (!sale.items.some((item) => item.productId === productId && item.cost === 0)) continue;
    const items = sale.items.map((item) =>
      item.productId === productId && item.cost === 0 ? { ...item, cost: unitCost } : item,
    );
    const cost = items.reduce((sum, item) => sum + getSaleItemCost(item), 0);
    changed.push({ ...sale, items, cost, profit: sale.total - cost });
  }
  return changed;
}
