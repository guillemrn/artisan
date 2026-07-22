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

  const sales: Sale[] = dbSales.map(s => {
    const dbItems = s.items as any[] ?? [];
    const actualPayment = dbItems[0]?._paymentMethod || s.payment;
    
    const cleanedItems: SaleItem[] = dbItems.map((item: any) => {
      const { _paymentMethod, ...cleanItem } = item;
      return cleanItem as SaleItem;
    });

    return {
      id: s.id,
      clientId: s.client_id,
      clientName: s.client_name,
      channel: s.channel as "PDV" | "Público",
      items: cleanedItems,
      total: Number(s.total),
      cost: Number(s.cost),
      profit: Number(s.profit),
      payment: actualPayment as PaymentMethod,
      status: s.status as "Pendiente" | "Entregado",
      createdAt: s.created_at,
    };
  });

  return { products, clients, sales };
}

export const artisanQueryKeys = {
  all: ["artisan"] as const,
  data: () => [...artisanQueryKeys.all, "data"] as const,
};

