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
export { artisanQueryKeys } from "./artisan-query-cache";

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

export function normalizeIsoDate(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString();
  let iso = dateStr.trim().replace(" ", "T");
  iso = iso.replace(/\+00(:00)?$/, "Z");
  if (!/[Zz]|\+\d{2}:?\d{2}|-\d{2}:?\d{2}$/.test(iso)) {
    iso += "Z";
  }
  return iso;
}

export function loadArtisanData(): ArtisanData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    const parsed = JSON.parse(raw) as ArtisanData;
    if (!parsed.sales || !parsed.clients || !parsed.products) return DEFAULT_DATA;
    parsed.sales = parsed.sales.map((s) => ({
      ...s,
      createdAt: normalizeIsoDate(s.createdAt),
    }));
    return parsed;
  } catch {
    return DEFAULT_DATA;
  }
}

export function saveArtisanData(data: ArtisanData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

type DatabaseSale = {
  id: string;
  client_id: string;
  client_name: string;
  channel: string;
  items: unknown;
  total: number | string;
  cost: number | string;
  profit: number | string;
  payment: string;
  status: string;
  created_at: string;
  paid_at?: string | null;
  price_mode?: string | null;
};

export function mapDatabaseSale(sale: DatabaseSale): Sale {
  return {
    id: sale.id,
    clientId: sale.client_id,
    clientName: sale.client_name,
    channel: sale.channel as "PDV" | "Público",
    items: (sale.items as SaleItem[]) ?? [],
    total: Number(sale.total),
    cost: Number(sale.cost),
    profit: Number(sale.profit),
    payment: sale.payment as PaymentMethod,
    status: sale.status as "Pendiente" | "Entregado",
    createdAt: normalizeIsoDate(sale.created_at),
    paidAt: sale.paid_at ? normalizeIsoDate(sale.paid_at) : undefined,
    priceMode:
      sale.price_mode === "distributor" || sale.price_mode === "public"
        ? sale.price_mode
        : undefined,
  };
}

export async function fetchArtisanData(expectedUserId?: string): Promise<ArtisanData> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) {
    throw new Error(`No se pudo validar la sesión: ${sessionError.message}`);
  }

  if (!session) {
    if (expectedUserId) {
      throw new Error("La sesión cambió mientras se cargaban los datos. Vuelve a intentarlo.");
    }
    return loadArtisanData();
  }
  const userId = session.user.id;

  if (expectedUserId && userId !== expectedUserId) {
    throw new Error("La sesión cambió mientras se cargaban los datos. Vuelve a intentarlo.");
  }

  // Fetch only the signed-in user's business data. RLS should enforce the same rule server-side.
  const [productsRes, clientsRes, salesRes] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("clients")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true }),
    supabase
      .from("sales")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  const firstError = productsRes.error ?? clientsRes.error ?? salesRes.error;
  if (firstError) {
    throw new Error(`No se pudieron cargar los datos del negocio: ${firstError.message}`);
  }

  const dbProducts = productsRes.data ?? [];
  const dbClients = clientsRes.data ?? [];
  const dbSales = salesRes.data ?? [];

  // Map database models to client types
  const products: Product[] = dbProducts.map((p) => ({
    id: p.id,
    name: p.name,
    cost: Number(p.cost),
    distributorPrice: Number(p.distributor_price),
    publicPrice: Number(p.public_price),
    stock: p.stock,
  }));

  const clients: Client[] = dbClients.map((c) => ({
    id: c.id,
    name: c.name,
    channel: c.channel as "PDV" | "Público",
    lastDelivery: c.last_delivery || undefined,
  }));

  const salesMap = new Map<string, Sale>();

  dbSales.forEach((s) => {
    const sale = mapDatabaseSale(s as DatabaseSale);

    salesMap.set(sale.id, sale);
  });

  const sales = Array.from(salesMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return { products, clients, sales };
}
