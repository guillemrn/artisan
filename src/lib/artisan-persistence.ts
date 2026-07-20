import { supabase } from "@/core/supabase/client";
import {
  SEED_SALES,
  CLIENTS,
  PRODUCTS,
  type Sale,
  type Client,
  type Product,
  type SaleItem,
  type PaymentMethod,
} from "./artisan-data";

const STORAGE_KEY = "artisan-data-v1";

export type ArtisanData = {
  sales: Sale[];
  clients: Client[];
  products: Product[];
};

const DEFAULT_DATA: ArtisanData = {
  sales: SEED_SALES,
  clients: CLIENTS,
  products: PRODUCTS,
};

export function loadArtisanData(): ArtisanData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as ArtisanData;
    if (!parsed.sales || !parsed.clients || !parsed.products) return DEFAULT_DATA;
    return parsed;
  } catch {
    return DEFAULT_DATA;
  }
}

export function saveArtisanData(data: ArtisanData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function fetchArtisanData(): Promise<ArtisanData> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return loadArtisanData();
  }

  // Fetch from Supabase
  const [productsRes, clientsRes, salesRes] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: true }),
    supabase.from("clients").select("*").order("created_at", { ascending: true }),
    supabase.from("sales").select("*").order("created_at", { ascending: false }),
  ]);

  const dbProducts = productsRes.data ?? [];
  const dbClients = clientsRes.data ?? [];
  const dbSales = salesRes.data ?? [];

  // If the user is new and has absolutely no data, we seed the database with the default data
  if (dbProducts.length === 0 && dbClients.length === 0 && dbSales.length === 0) {
    const userId = session.user.id;

    // Seed products
    const productsToInsert = PRODUCTS.map(p => ({
      id: p.id,
      name: p.name,
      cost: p.cost,
      distributor_price: p.distributorPrice,
      public_price: p.publicPrice,
      stock: p.stock,
      user_id: userId,
    }));
    await supabase.from("products").insert(productsToInsert);

    // Seed clients
    const clientsToInsert = CLIENTS.map(c => ({
      id: c.id,
      name: c.name,
      channel: c.channel,
      last_delivery: c.lastDelivery ?? null,
      user_id: userId,
    }));
    await supabase.from("clients").insert(clientsToInsert);

    // Seed sales
    const salesToInsert = SEED_SALES.map(s => ({
      id: s.id,
      client_id: s.clientId,
      client_name: s.clientName,
      channel: s.channel,
      items: s.items,
      total: s.total,
      cost: s.cost,
      profit: s.profit,
      payment: s.payment,
      status: s.status,
      created_at: s.createdAt,
      user_id: userId,
    }));
    await supabase.from("sales").insert(salesToInsert);

    return DEFAULT_DATA;
  }

  // Map database models to client types
  const products: Product[] = dbProducts.map(p => ({
    id: p.id,
    name: p.name,
    cost: Number(p.cost),
    distributorPrice: Number(p.distributor_price),
    publicPrice: Number(p.public_price),
    stock: p.stock,
  }));

  const clients: Client[] = dbClients.map(c => ({
    id: c.id,
    name: c.name,
    channel: c.channel as "PDV" | "Público",
    lastDelivery: c.last_delivery || undefined,
  }));

  const sales: Sale[] = dbSales.map(s => ({
    id: s.id,
    clientId: s.client_id,
    clientName: s.client_name,
    channel: s.channel as "PDV" | "Público",
    items: s.items as SaleItem[],
    total: Number(s.total),
    cost: Number(s.cost),
    profit: Number(s.profit),
    payment: s.payment as PaymentMethod,
    status: s.status as "Pendiente" | "Entregado",
    createdAt: s.created_at,
  }));

  return { products, clients, sales };
}

export const artisanQueryKeys = {
  all: ["artisan"] as const,
  data: () => [...artisanQueryKeys.all, "data"] as const,
};

