import type { Sale } from "./artisan-data";

export function buildRegisterSalePayload(sale: Sale) {
  if (!sale.priceMode) {
    throw new Error("La venta necesita un tipo de precio válido.");
  }

  return {
    p_sale_id: sale.id,
    p_client_id: sale.clientId,
    p_items: sale.items.map((item) => ({
      productId: item.productId,
      qty: item.qty,
      returnQty: item.returnQty ?? 0,
    })),
    p_price_mode: sale.priceMode,
    p_payment: sale.payment,
  };
}
