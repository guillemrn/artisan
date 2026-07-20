export type Product = {
  id: string;
  name: string;
  cost: number;
  distributorPrice: number;
  publicPrice: number;
  stock: number;
};

export type Client = {
  id: string;
  name: string;
  channel: "PDV" | "Público";
  lastDelivery?: string;
};

export type PaymentMethod = "Efectivo" | "Transferencia" | "Pendiente";

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
};

export const PRODUCTS: Product[] = [
  {
    id: "pan-clasico",
    name: "Pan Pita Clásico",
    cost: 21.97,
    distributorPrice: 55,
    publicPrice: 69,
    stock: 40,
  },
  {
    id: "pan-integral",
    name: "Pan Pita Integral",
    cost: 20.55,
    distributorPrice: 62,
    publicPrice: 79,
    stock: 24,
  },
  {
    id: "chile-ajonjoli",
    name: "Chile de Ajonjolí",
    cost: 25.63,
    distributorPrice: 60,
    publicPrice: 75,
    stock: 18,
  },
  {
    id: "chamoy-jamaica",
    name: "Chamoy de Jamaica",
    cost: 40,
    distributorPrice: 68,
    publicPrice: 85,
    stock: 12,
  },
  {
    id: "chile-cacahuate",
    name: "Chile de Cacahuate",
    cost: 24.26,
    distributorPrice: 60,
    publicPrice: 75,
    stock: 15,
  },
];

export const CLIENTS: Client[] = [
  { id: "magana", name: "Mini Súper Magaña's", channel: "PDV", lastDelivery: "Ayer" },
  { id: "gaby", name: "Cremería Gaby's", channel: "PDV", lastDelivery: "Hace 2 días" },
  { id: "olivares", name: "Súper Olivares", channel: "PDV", lastDelivery: "Hace 3 días" },
  { id: "apolinar", name: "Frutería Apolinar", channel: "PDV", lastDelivery: "Hace 5 días" },
  { id: "elena", name: "Elena", channel: "Público", lastDelivery: "Hace 1 semana" },
  { id: "lolita", name: "Sra. Lolita", channel: "Público", lastDelivery: "Hace 2 semanas" },
];

export const BUSINESS_NAME = "Pan Pita Artesanal";
export const USER_NAME = "María";

// Sample route/history seed
export const SEED_SALES: Sale[] = [
  {
    id: "s1",
    clientId: "magana",
    clientName: "Mini Súper Magaña's",
    channel: "PDV",
    items: [
      {
        productId: "pan-clasico",
        productName: "Pan Pita Clásico",
        qty: 3,
        unitPrice: 55,
        cost: 21.97,
      },
      {
        productId: "pan-integral",
        productName: "Pan Pita Integral",
        qty: 2,
        unitPrice: 62,
        cost: 20.55,
      },
    ],
    total: 3 * 55 + 2 * 62,
    cost: 3 * 21.97 + 2 * 20.55,
    profit: 3 * 55 + 2 * 62 - (3 * 21.97 + 2 * 20.55),
    payment: "Efectivo",
    status: "Entregado",
    createdAt: new Date().toISOString(),
  },
  {
    id: "s2",
    clientId: "gaby",
    clientName: "Cremería Gaby's",
    channel: "PDV",
    items: [
      {
        productId: "pan-clasico",
        productName: "Pan Pita Clásico",
        qty: 4,
        unitPrice: 55,
        cost: 21.97,
      },
    ],
    total: 4 * 55,
    cost: 4 * 21.97,
    profit: 4 * 55 - 4 * 21.97,
    payment: "Transferencia",
    status: "Entregado",
    createdAt: new Date().toISOString(),
  },
  {
    id: "s3",
    clientId: "apolinar",
    clientName: "Frutería Apolinar",
    channel: "PDV",
    items: [
      {
        productId: "pan-clasico",
        productName: "Pan Pita Clásico",
        qty: 2,
        unitPrice: 55,
        cost: 21.97,
      },
    ],
    total: 2 * 55,
    cost: 2 * 21.97,
    profit: 2 * 55 - 2 * 21.97,
    payment: "Pendiente",
    status: "Pendiente",
    createdAt: new Date().toISOString(),
  },
  {
    id: "s4",
    clientId: "elena",
    clientName: "Elena",
    channel: "Público",
    items: [
      {
        productId: "pan-clasico",
        productName: "Pan Pita Clásico",
        qty: 1,
        unitPrice: 69,
        cost: 21.97,
      },
      {
        productId: "chile-ajonjoli",
        productName: "Chile de Ajonjolí",
        qty: 1,
        unitPrice: 75,
        cost: 25.63,
      },
    ],
    total: 69 + 75,
    cost: 21.97 + 25.63,
    profit: 69 + 75 - (21.97 + 25.63),
    payment: "Pendiente",
    status: "Pendiente",
    createdAt: new Date().toISOString(),
  },
];

export const PRODUCTION_SUGGESTIONS = [
  { name: "Pan Pita Clásico", qty: 22 },
  { name: "Pan Pita Integral", qty: 6 },
];

export const formatMXN = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);

export const formatMXNc = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
