import type { ProductCosting } from "./product-costing";

export type Product = {
  id: string;
  name: string;
  cost: number;
  distributorPrice: number;
  publicPrice: number;
  stock: number;
  /** Si es false, se vende sin límite y no se descuenta stock. Sin definir = true (datos previos). */
  trackStock?: boolean;
  /** Creado al vender como "solo esta venta": existe para la venta, pero no sale en el catálogo. */
  archived?: boolean;
  /** Se creó sin costo (al vender). Su ganancia no es real hasta que se capture el costo. */
  needsCost?: boolean;
  costing?: ProductCosting;
};

export function tracksStock(product: Pick<Product, "trackStock">): boolean {
  return product.trackStock !== false;
}

export type Client = {
  id: string;
  name: string;
  channel: "PDV" | "Público";
  lastDelivery?: string;
};

/**
 * "Público general": venta de mostrador a alguien sin nombre (como el RFC genérico).
 * Vive como cliente reservado en la base para que register_sale lo acepte, pero no se
 * muestra en la lista de clientes ni en rankings, y solo admite pago al momento.
 */
export const WALK_IN_CLIENT_ID = "publico-general";
export const WALK_IN_CLIENT: Client = {
  id: WALK_IN_CLIENT_ID,
  name: "Público general",
  channel: "Público",
};
export function isWalkInClient(clientId: string | undefined | null): boolean {
  return clientId === WALK_IN_CLIENT_ID;
}
/** Formas de pago que dejan saldo pendiente (no se permiten con Público general). */
export const DEFERRED_PAYMENTS: PaymentMethod[] = ["Pendiente", "Consignación"];

export type PaymentMethod =
  "Efectivo" | "Transferencia" | "Pendiente" | "Consignación" | "Cortesía";
export type PriceMode = "distributor" | "public";

export type SaleItem = {
  productId: string;
  productName: string;
  qty: number;
  returnQty?: number;
  unitPrice: number;
  cost: number;
};

export type Sale = {
  id: string;
  clientId: string;
  clientName: string;
  channel: "PDV" | "Público";
  items: SaleItem[];
  total: number;
  cost: number;
  profit: number;
  payment: PaymentMethod;
  status: "Pendiente" | "Entregado";
  createdAt: string; // ISO
  paidAt?: string; // ISO; when payment was actually received
  priceMode?: PriceMode;
};

export function getSalePaymentDate(sale: Sale): string | undefined {
  if (sale.paidAt) return sale.paidAt;
  return sale.status === "Entregado" ? sale.createdAt : undefined;
}

export function getSaleDashboardDate(sale: Sale): string {
  return getSalePaymentDate(sale) ?? sale.createdAt;
}

export const PRODUCTS: Product[] = [
  {
    id: "vela-ambar",
    name: "Vela Ambar",
    cost: 48,
    distributorPrice: 95,
    publicPrice: 140,
    stock: 40,
  },
  {
    id: "jabones-botanicos",
    name: "Jabones Botanicos",
    cost: 22,
    distributorPrice: 48,
    publicPrice: 65,
    stock: 24,
  },
  {
    id: "miel-citrica",
    name: "Miel Citrica",
    cost: 38,
    distributorPrice: 78,
    publicPrice: 110,
    stock: 18,
  },
  {
    id: "collar-luna",
    name: "Collar Luna",
    cost: 72,
    distributorPrice: 145,
    publicPrice: 220,
    stock: 12,
  },
  {
    id: "pan-temporada",
    name: "Pan de Temporada",
    cost: 18,
    distributorPrice: 42,
    publicPrice: 58,
    stock: 15,
  },
];

export const CLIENTS: Client[] = [
  { id: "almacen-norte", name: "Almacen Norte", channel: "PDV", lastDelivery: "Ayer" },
  { id: "cafe-aurora", name: "Cafe Aurora", channel: "PDV", lastDelivery: "Hace 2 dias" },
  { id: "bazar-central", name: "Bazar Central", channel: "PDV", lastDelivery: "Hace 3 dias" },
  { id: "tienda-rio", name: "Tienda Rio", channel: "PDV", lastDelivery: "Hace 5 dias" },
  {
    id: "cliente-muestra-a",
    name: "Cliente Muestra A",
    channel: "Público",
    lastDelivery: "Hace 1 semana",
  },
  {
    id: "cliente-muestra-b",
    name: "Cliente Muestra B",
    channel: "Público",
    lastDelivery: "Hace 2 semanas",
  },
];

export const BUSINESS_NAME = "Grofit - Punto de venta";
export const USER_NAME = "María";

// Sample route/history seed
export const SEED_SALES: Sale[] = [
  {
    id: "s1",
    clientId: "almacen-norte",
    clientName: "Almacen Norte",
    channel: "PDV",
    items: [
      {
        productId: "vela-ambar",
        productName: "Vela Ambar",
        qty: 3,
        unitPrice: 95,
        cost: 48,
      },
      {
        productId: "jabones-botanicos",
        productName: "Jabones Botanicos",
        qty: 2,
        unitPrice: 48,
        cost: 22,
      },
    ],
    total: 3 * 95 + 2 * 48,
    cost: 3 * 48 + 2 * 22,
    profit: 3 * 95 + 2 * 48 - (3 * 48 + 2 * 22),
    payment: "Efectivo",
    status: "Entregado",
    createdAt: new Date().toISOString(),
  },
  {
    id: "s2",
    clientId: "cafe-aurora",
    clientName: "Cafe Aurora",
    channel: "PDV",
    items: [
      {
        productId: "vela-ambar",
        productName: "Vela Ambar",
        qty: 4,
        unitPrice: 95,
        cost: 48,
      },
    ],
    total: 4 * 95,
    cost: 4 * 48,
    profit: 4 * 95 - 4 * 48,
    payment: "Transferencia",
    status: "Entregado",
    createdAt: new Date().toISOString(),
  },
  {
    id: "s3",
    clientId: "tienda-rio",
    clientName: "Tienda Rio",
    channel: "PDV",
    items: [
      {
        productId: "miel-citrica",
        productName: "Miel Citrica",
        qty: 2,
        unitPrice: 78,
        cost: 38,
      },
    ],
    total: 2 * 78,
    cost: 2 * 38,
    profit: 2 * 78 - 2 * 38,
    payment: "Pendiente",
    status: "Pendiente",
    createdAt: new Date().toISOString(),
  },
  {
    id: "s4",
    clientId: "cliente-muestra-a",
    clientName: "Cliente Muestra A",
    channel: "Público",
    items: [
      {
        productId: "collar-luna",
        productName: "Collar Luna",
        qty: 1,
        unitPrice: 220,
        cost: 72,
      },
      {
        productId: "pan-temporada",
        productName: "Pan de Temporada",
        qty: 1,
        unitPrice: 58,
        cost: 18,
      },
    ],
    total: 220 + 58,
    cost: 72 + 18,
    profit: 220 + 58 - (72 + 18),
    payment: "Pendiente",
    status: "Pendiente",
    createdAt: new Date().toISOString(),
  },
];

export const PRODUCTION_SUGGESTIONS = [
  { name: "Vela Ambar", qty: 22 },
  { name: "Jabones Botanicos", qty: 6 },
];

export const formatMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);

export const formatMXNc = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
