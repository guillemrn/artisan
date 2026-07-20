import {
  SEED_SALES,
  CLIENTS,
  PRODUCTS,
  type Sale,
  type Client,
  type Product,
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
  return loadArtisanData();
}

export const artisanQueryKeys = {
  all: ["artisan"] as const,
  data: () => [...artisanQueryKeys.all, "data"] as const,
};
