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

import { useAuth } from "@/core/auth/auth-context";
import { supabase } from "@/core/supabase/client";

type DraftSale = {
  client: Client | null;
  priceMode: "distributor" | "public";
  quantities: Record<string, number>;
  returns: Record<string, number>;
  payment: PaymentMethod;
};

const emptyDraft = (): DraftSale => ({
  client: null,
  priceMode: "distributor",
  quantities: {},
  returns: {},
  payment: "Efectivo",
});

type Ctx = {
  sales: Sale[];
  addSale: (s: Sale) => Promise<void>;
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
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  isLoading: boolean;
};

const ArtisanContext = createContext<Ctx | null>(null);

function applyStockDeduction(products: Product[], sale: Sale): Product[] {
  return products.map((p) => {
    const item = sale.items.find((i) => i.productId === p.id);
    if (!item) return p;
    return { ...p, stock: Math.max(0, p.stock - item.qty - (item.returnQty ?? 0)) };
  });
}

function updateClientLastDelivery(clients: Client[], clientId: string): Client[] {
  return clients.map((c) => (c.id === clientId ? { ...c, lastDelivery: "Hoy" } : c));
}

export function ArtisanProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isDemo } = useAuth();
  
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
      if (isDemo) {
        saveArtisanData(next);
      }
      queryClient.setQueryData(artisanQueryKeys.data(), next);
    },
    [queryClient, isDemo],
  );

  const value = useMemo<Ctx>(
    () => ({
      sales,
      isLoading,
      lastSaleId,
      setLastSaleId,
      getSale: (id) => sales.find((s) => s.id === id),
      addSale: async (s) => {
        const nextClients = updateClientLastDelivery(clients, s.clientId);
        const nextProducts = applyStockDeduction(products, s);

        if (isDemo) {
          persist({
            sales: [s, ...sales],
            clients: nextClients,
            products: nextProducts,
          });
          setLastSaleId(s.id);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No hay una sesión de usuario activa");

        // Insert sale
        const { error: saleError } = await supabase.from("sales").insert({
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
          user_id: session.user.id,
        });

        if (saleError) {
          console.error("Error inserting sale to Supabase:", saleError);
          throw new Error(`Error al registrar la venta en la base de datos: ${saleError.message}`);
        }

        // Update client last delivery
        const { error: clientError } = await supabase.from("clients")
          .update({ last_delivery: "Hoy" })
          .eq("id", s.clientId);

        if (clientError) {
          console.error("Error updating client last delivery:", clientError);
        }

        // Update product stock levels
        await Promise.all(
          s.items.map(async (item) => {
            const prod = products.find(p => p.id === item.productId);
            if (prod) {
              const { error: prodError } = await supabase.from("products")
                .update({ stock: Math.max(0, prod.stock - item.qty - (item.returnQty ?? 0)) })
                .eq("id", item.productId);
              if (prodError) {
                console.error(`Error updating stock for product ${item.productId}:`, prodError);
              }
            }
          })
        );

        persist({
          sales: [s, ...sales],
          clients: nextClients,
          products: nextProducts,
        });
        setLastSaleId(s.id);
      },
      updateSaleStatus: async (id, status, payment) => {
        if (isDemo) {
          persist({
            sales: sales.map((sale) => (sale.id === id ? { ...sale, status, payment } : sale)),
            clients,
            products,
          });
          return;
        }

        const { error } = await supabase.from("sales")
          .update({ status, payment })
          .eq("id", id);

        if (error) {
          console.error("Error updating sale status:", error);
          throw new Error(`Error al actualizar el estado de la venta: ${error.message}`);
        }

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
      addClient: async (c) => {
        if (isDemo) {
          persist({ sales, clients: [c, ...clients], products });
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No hay una sesión de usuario activa");

        const { error } = await supabase.from("clients").insert({
          id: c.id,
          name: c.name,
          channel: c.channel,
          last_delivery: c.lastDelivery ?? null,
          user_id: session.user.id,
        });

        if (error) {
          console.error("Error inserting client:", error);
          throw new Error(`Error al agregar el cliente: ${error.message}`);
        }

        persist({ sales, clients: [c, ...clients], products });
      },
      deleteClient: async (id) => {
        if (isDemo) {
          persist({ sales, clients: clients.filter((c) => c.id !== id), products });
          return;
        }

        const { error } = await supabase.from("clients").delete().eq("id", id);
        if (error) {
          console.error("Error deleting client:", error);
          throw new Error(`Error al eliminar el cliente: ${error.message}`);
        }

        persist({ sales, clients: clients.filter((c) => c.id !== id), products });
      },
      products,
      addProduct: async (p) => {
        if (isDemo) {
          persist({ sales, clients, products: [...products, p] });
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No hay una sesión de usuario activa");

        const { error } = await supabase.from("products").insert({
          id: p.id,
          name: p.name,
          cost: p.cost,
          distributor_price: p.distributorPrice,
          public_price: p.publicPrice,
          stock: p.stock,
          user_id: session.user.id,
        });

        if (error) {
          console.error("Error inserting product:", error);
          throw new Error(`Error al agregar el producto: ${error.message}`);
        }

        persist({ sales, clients, products: [...products, p] });
      },
      deleteProduct: async (id) => {
        if (isDemo) {
          persist({ sales, clients, products: products.filter((p) => p.id !== id) });
          return;
        }

        const { error } = await supabase.from("products").delete().eq("id", id);
        if (error) {
          console.error("Error deleting product:", error);
          throw new Error(`Error al eliminar el producto: ${error.message}`);
        }

        persist({ sales, clients, products: products.filter((p) => p.id !== id) });
      },
      updateProduct: async (p) => {
        if (isDemo) {
          persist({
            sales,
            clients,
            products: products.map((prod) => (prod.id === p.id ? p : prod)),
          });
          return;
        }

        const { error } = await supabase
          .from("products")
          .update({
            name: p.name,
            cost: p.cost,
            distributor_price: p.distributorPrice,
            public_price: p.publicPrice,
            stock: p.stock,
          })
          .eq("id", p.id);

        if (error) {
          console.error("Error updating product:", error);
          throw new Error(`Error al actualizar el producto: ${error.message}`);
        }

        persist({
          sales,
          clients,
          products: products.map((prod) => (prod.id === p.id ? p : prod)),
        });
      },
    }),
    [sales, clients, products, draft, lastSaleId, isLoading, persist, isDemo],
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
  returns: Record<string, number>,
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
    .filter((p) => (quantities[p.id] ?? 0) > 0 || (returns[p.id] ?? 0) > 0)
    .map((p) => ({
      productId: p.id,
      productName: p.name,
      qty: quantities[p.id] ?? 0,
      returnQty: returns[p.id] ?? 0,
      unitPrice: priceMode === "distributor" ? p.distributorPrice : p.publicPrice,
      cost: p.cost,
    }));
}
