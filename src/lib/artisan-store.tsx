import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SEED_SALES,
  CLIENTS,
  PRODUCTS,
  type Sale,
  type PaymentMethod,
  type SaleItem,
  type Client,
  type Product,
} from "./artisan-data";
import {
  artisanQueryKeys,
  fetchArtisanData,
  saveArtisanData,
  type ArtisanData,
} from "./artisan-persistence";

type DraftSale = {
  client: Client | null;
  priceMode: "distributor" | "public";
  quantities: Record<string, number>;
  payment: PaymentMethod;
};

const emptyDraft = (): DraftSale => ({
  client: null,
  priceMode: "distributor",
  quantities: {},
  payment: "Efectivo",
});

type Ctx = {
  sales: Sale[];
  addSale: (s: Sale) => void;
  updateSaleStatus: (id: string, status: Sale["status"], payment: PaymentMethod) => void;
  getSale: (id: string) => Sale | undefined;
  lastSaleId: string | null;
  setLastSaleId: (id: string | null) => void;
  draft: DraftSale;
  setDraft: (u: (d: DraftSale) => DraftSale) => void;
  resetDraft: () => void;
  clients: Client[];
  addClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  products: Product[];
  addProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  isLoading: boolean;
};

const ArtisanContext = createContext<Ctx | null>(null);

function applyStockDeduction(products: Product[], sale: Sale): Product[] {
  return products.map((p) => {
    const item = sale.items.find((i) => i.productId === p.id);
    if (!item) return p;
    return { ...p, stock: Math.max(0, p.stock - item.qty) };
  });
}

function updateClientLastDelivery(clients: Client[], clientId: string): Client[] {
  return clients.map((c) => (c.id === clientId ? { ...c, lastDelivery: "Hoy" } : c));
}

export function ArtisanProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: artisanQueryKeys.data(),
    queryFn: fetchArtisanData,
    staleTime: Infinity,
  });

  const sales = data?.sales ?? SEED_SALES;
  const clients = data?.clients ?? CLIENTS;
  const products = data?.products ?? PRODUCTS;

  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [draft, setDraftState] = useState<DraftSale>(emptyDraft());

  const persist = useCallback(
    (next: ArtisanData) => {
      saveArtisanData(next);
      queryClient.setQueryData(artisanQueryKeys.data(), next);
    },
    [queryClient],
  );

  const value = useMemo<Ctx>(
    () => ({
      sales,
      isLoading,
      lastSaleId,
      setLastSaleId,
      getSale: (id) => sales.find((s) => s.id === id),
      addSale: (s) => {
        persist({
          sales: [s, ...sales],
          clients: updateClientLastDelivery(clients, s.clientId),
          products: applyStockDeduction(products, s),
        });
        setLastSaleId(s.id);
      },
      updateSaleStatus: (id, status, payment) => {
        persist({
          sales: sales.map((sale) => (sale.id === id ? { ...sale, status, payment } : sale)),
          clients,
          products,
        });
      },
      draft,
      setDraft: (u) => setDraftState((d) => u(d)),
      resetDraft: () => setDraftState(emptyDraft()),
      clients,
      addClient: (c) => {
        persist({ sales, clients: [c, ...clients], products });
      },
      deleteClient: (id) => {
        persist({ sales, clients: clients.filter((c) => c.id !== id), products });
      },
      products,
      addProduct: (p) => {
        persist({ sales, clients, products: [...products, p] });
      },
      deleteProduct: (id) => {
        persist({ sales, clients, products: products.filter((p) => p.id !== id) });
      },
    }),
    [sales, clients, products, draft, lastSaleId, isLoading, persist],
  );

  return <ArtisanContext.Provider value={value}>{children}</ArtisanContext.Provider>;
}

export function useArtisan() {
  const ctx = useContext(ArtisanContext);
  if (!ctx) throw new Error("useArtisan must be used inside ArtisanProvider");
  return ctx;
}

export function buildSaleItems(
  quantities: Record<string, number>,
  priceMode: "distributor" | "public",
  products: {
    id: string;
    name: string;
    distributorPrice: number;
    publicPrice: number;
    cost: number;
  }[],
): SaleItem[] {
  return products
    .filter((p) => (quantities[p.id] ?? 0) > 0)
    .map((p) => ({
      productId: p.id,
      productName: p.name,
      qty: quantities[p.id],
      unitPrice: priceMode === "distributor" ? p.distributorPrice : p.publicPrice,
      cost: p.cost,
    }));
}
