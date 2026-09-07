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
