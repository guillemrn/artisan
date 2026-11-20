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
  tracksStock,
  WALK_IN_CLIENT,
  isWalkInClient,
} from "./artisan-data";
import {
  artisanQueryKeys,
  fetchArtisanData,
  mapDatabaseSale,
  saveArtisanData,
  type ArtisanData,
} from "./artisan-persistence";
import { buildRegisterSalePayload } from "./artisan-sale-registration";
import type { ProductCosting } from "./product-costing";

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
  updateSaleStatus: (id: string, status: Sale["status"], payment: PaymentMethod) => Promise<void>;
  getSale: (id: string) => Sale | undefined;
  lastSaleId: string | null;
  setLastSaleId: (id: string | null) => void;
  draft: DraftSale;
  setDraft: (u: (d: DraftSale) => DraftSale) => void;
  resetDraft: () => void;
  clients: Client[];
  addClient: (c: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  products: Product[];
  /** Incluye los archivados ("solo esta venta"); para armar ventas y tickets. */
  allProducts: Product[];
  addProduct: (p: Product, costing?: ProductCosting) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  /** Ajuste general del negocio: si está apagado, se vende sin límite y no se descuenta stock. */
  inventoryEnabled: boolean;
  setInventoryEnabled: (enabled: boolean) => Promise<void>;
  isLoading: boolean;
  loadError: string | null;
};

const ArtisanContext = createContext<Ctx | null>(null);
const EMPTY_SALES: Sale[] = [];
const EMPTY_CLIENTS: Client[] = [];
const EMPTY_PRODUCTS: Product[] = [];

function applyStockDeduction(products: Product[], sale: Sale): Product[] {
  return products.map((p) => {
    const item = sale.items.find((i) => i.productId === p.id);
    if (!item || !tracksStock(p)) return p;
    return { ...p, stock: Math.max(0, p.stock - item.qty - (item.returnQty ?? 0)) };
  });
}

function updateClientLastDelivery(clients: Client[], clientId: string): Client[] {
  return clients.map((c) => (c.id === clientId ? { ...c, lastDelivery: "Hoy" } : c));
}

async function requireActiveSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`No se pudo validar tu sesión: ${error.message}`);
  }
  if (!session) {
    throw new Error("No hay una sesión de usuario activa");
  }
  return session;
}

export function ArtisanProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isDemo, user } = useAuth();
  const cacheOwnerId = isDemo ? "demo" : user?.id;
  const queryKey = useMemo(
    () => artisanQueryKeys.data(cacheOwnerId ?? "signed-out"),
    [cacheOwnerId],
  );

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fetchArtisanData(isDemo ? undefined : cacheOwnerId),
    enabled: isDemo || Boolean(cacheOwnerId),
    staleTime: Infinity,
    retry: 1,
  });

  const sales = data?.sales ?? (isDemo ? SEED_SALES : EMPTY_SALES);
  const allClients = data?.clients ?? (isDemo ? CLIENTS : EMPTY_CLIENTS);
  // "Público general" existe en la base pero no se lista como cliente.
  const clients = useMemo(
    () => allClients.filter((c) => !isWalkInClient(c.id)),
    [allClients],
  );
  const hasWalkInRow = allClients.some((c) => isWalkInClient(c.id));
  const allProducts = data?.products ?? (isDemo ? PRODUCTS : EMPTY_PRODUCTS);
  // Los productos de "solo esta venta" existen (la venta los necesita) pero no salen en el catálogo.
  const products = useMemo(() => allProducts.filter((p) => !p.archived), [allProducts]);
  const loadError =
    error instanceof Error ? error.message : error ? "No se pudieron cargar los datos." : null;

  // Fuente de verdad: user_metadata.inventory_enabled. Cuentas anteriores sin ese dato
  // heredan lo que ya tenían sus productos (si alguno llevaba inventario, sigue activo).
  const [inventoryOverride, setInventoryOverride] = useState<boolean | null>(null);
  const metaInventory = user?.user_metadata?.inventory_enabled;
  const inventoryEnabled =
    inventoryOverride ??
    (typeof metaInventory === "boolean" ? metaInventory : products.some(tracksStock));

  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  const [draft, setDraftState] = useState<DraftSale>(emptyDraft());

  const persist = useCallback(
    (next: ArtisanData) => {
      queryClient.setQueryData<ArtisanData>(queryKey, (old) => {
        if (!old) {
          if (isDemo) saveArtisanData(next);
          return next;
        }

        // Deduplicate sales by ID and sort descending by createdAt
        const salesMap = new Map<string, Sale>();
        next.sales.forEach((s) => salesMap.set(s.id, s));
        old.sales.forEach((s) => {
          if (!salesMap.has(s.id)) {
            salesMap.set(s.id, s);
          }
        });

        const mergedSales = Array.from(salesMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        const merged: ArtisanData = {
          sales: mergedSales,
          clients: next.clients,
          products: next.products,
        };

        if (isDemo) {
          saveArtisanData(merged);
        }
        return merged;
      });
    },
    [queryClient, queryKey, isDemo],
  );

  const value = useMemo<Ctx>(
    () => ({
      sales,
      isLoading,
      loadError,
      lastSaleId,
      setLastSaleId,
      getSale: (id) => sales.find((s) => s.id === id),
      addSale: async (s) => {
        const nextClients = updateClientLastDelivery(clients, s.clientId);
        const nextProducts = applyStockDeduction(allProducts, s);

        if (isDemo) {
          persist({
            sales: [s, ...sales],
            clients: nextClients,
            products: nextProducts,
          });
          setLastSaleId(s.id);
          return;
        }

        const session = await requireActiveSession();

        if (isWalkInClient(s.clientId) && !hasWalkInRow) {
          const { error: walkInError } = await supabase.from("clients").upsert(
            {
              id: WALK_IN_CLIENT.id,
              name: WALK_IN_CLIENT.name,
              channel: WALK_IN_CLIENT.channel,
              last_delivery: null,
              user_id: session.user.id,
            },
            { onConflict: "user_id,id", ignoreDuplicates: true },
          );
          if (walkInError) {
            console.error("Error preparing walk-in client:", walkInError);
            throw new Error(`No se pudo preparar "Público general": ${walkInError.message}`);
          }
        }

        const { data: registeredRow, error: saleError } = await supabase.rpc(
          "register_sale",
          buildRegisterSalePayload(s),
        );

        if (saleError) {
          console.error("Error registering sale transaction:", saleError);
          throw new Error(`Error al registrar la venta: ${saleError.message}`);
        }

        const row = Array.isArray(registeredRow) ? registeredRow[0] : registeredRow;
        if (!row) {
          throw new Error("Supabase no devolvió la venta registrada.");
        }
        const registeredSale = mapDatabaseSale(row);

        persist({
          sales: [registeredSale, ...sales],
          clients: nextClients,
          products: nextProducts,
        });
        setLastSaleId(registeredSale.id);
        queryClient.invalidateQueries({ queryKey });
      },
      updateSaleStatus: async (id, status, payment) => {
        const paidAt = status === "Entregado" ? new Date().toISOString() : undefined;

        if (isDemo) {
          persist({
            sales: sales.map((sale) =>
              sale.id === id ? { ...sale, status, payment, paidAt } : sale,
            ),
            clients,
            products: allProducts,
          });
          return;
        }

        const session = await requireActiveSession();

        const { error } = await supabase
          .from("sales")
          .update({ status, payment, paid_at: paidAt ?? null })
          .eq("id", id)
          .eq("user_id", session.user.id);

        if (error) {
          console.error("Error updating sale status:", error);
          throw new Error(`Error al actualizar el estado de la venta: ${error.message}`);
        }

        persist({
          sales: sales.map((sale) =>
            sale.id === id ? { ...sale, status, payment, paidAt } : sale,
          ),
          clients,
          products: allProducts,
        });
      },
      draft,
      setDraft: (u) => setDraftState((d) => u(d)),
      resetDraft: () => setDraftState(emptyDraft()),
      clients,
      addClient: async (c) => {
        if (isDemo) {
          persist({ sales, clients: [c, ...clients], products: allProducts });
          return;
        }

        const session = await requireActiveSession();

        const { error } = await supabase.from("clients").insert({
          id: c.id,
          name: c.name,
          channel: c.channel,
          last_delivery: c.lastDelivery ?? null,
          user_id: session.user.id,
        });

        if (error) {
          console.error("Error inserting client:", error);
          if (error.code === "23505") {
            throw new Error("Este cliente ya está registrado en tu cuenta.");
          }
          throw new Error(`Error al agregar el cliente: ${error.message}`);
        }

        persist({ sales, clients: [c, ...clients], products: allProducts });
      },
      deleteClient: async (id) => {
        if (isDemo) {
          persist({ sales, clients: clients.filter((c) => c.id !== id), products: allProducts });
          return;
        }

        const session = await requireActiveSession();

        const { error } = await supabase
          .from("clients")
          .delete()
          .eq("id", id)
          .eq("user_id", session.user.id);
        if (error) {
          console.error("Error deleting client:", error);
          throw new Error(`Error al eliminar el cliente: ${error.message}`);
        }

        persist({ sales, clients: clients.filter((c) => c.id !== id), products: allProducts });
      },
      products,
      allProducts,
      addProduct: async (p, costing) => {
        // El producto sigue el ajuste general de inventario.
        const track = p.trackStock ?? inventoryEnabled;
        const base: Product = {
          ...p,
          trackStock: track,
          stock: track ? p.stock : 0,
        };
        const product = costing ? { ...base, cost: costing.productCost, costing } : base;
        if (isDemo) {
          persist({ sales, clients, products: [...allProducts, product] });
          return;
        }

        await requireActiveSession();

        const { data: createdRow, error } = await supabase.rpc("create_product_with_costing", {
          p_product_id: product.id,
          p_name: product.name,
          p_cost: product.cost,
          p_distributor_price: product.distributorPrice,
          p_public_price: product.publicPrice,
          p_stock: product.stock,
          p_costing: costing ?? null,
        });

        if (error) {
          console.error("Error inserting product:", error);
          throw new Error(`Error al agregar el producto: ${error.message}`);
        }

        const row = Array.isArray(createdRow) ? createdRow[0] : createdRow;
        const savedProduct = row
          ? {
              ...product,
              name: row.name,
              cost: Number(row.cost),
              distributorPrice: Number(row.distributor_price),
              publicPrice: Number(row.public_price),
              stock: Number(row.stock),
            }
          : product;

        // La función de alta no conoce track_stock, archived ni needs_cost: se fijan después.
        const trackStock = tracksStock(product);
        const extra: Record<string, boolean> = { track_stock: trackStock };
        if (product.archived) extra.archived = true;
        if (product.needsCost) extra.needs_cost = true;
        const { error: extraError } = await supabase
          .from("products")
          .update(extra)
          .eq("id", savedProduct.id);
        if (extraError) {
          console.error("Error updating product flags:", extraError);
          if (/archived|needs_cost/.test(extraError.message)) {
            throw new Error(
              "Falta aplicar la migración de productos rápidos en Supabase (202611200003_quick_products.sql).",
            );
          }
          throw new Error(`El producto se creó, pero no se pudo terminar de guardar: ${extraError.message}`);
        }
        savedProduct.archived = product.archived;
        savedProduct.needsCost = product.needsCost;
        savedProduct.trackStock = trackStock;

        persist({ sales, clients, products: [...allProducts, savedProduct] });
      },
      deleteProduct: async (id) => {
        // Si ya se vendió, se archiva (las ventas siguen mostrándolo); si no, se borra.
        const usedInSales = sales.some((sale) => sale.items.some((item) => item.productId === id));
        if (usedInSales) {
          const target = allProducts.find((prod) => prod.id === id);
          if (!target) return;
          const archivedProduct = { ...target, archived: true };
          if (isDemo) {
            persist({ sales, clients, products: allProducts.map((prod) => (prod.id === id ? archivedProduct : prod)) });
            return;
          }
          const session = await requireActiveSession();
          const { error } = await supabase
            .from("products")
            .update({ archived: true })
            .eq("id", id)
            .eq("user_id", session.user.id);
          if (error) {
            console.error("Error archiving product:", error);
            throw new Error(`Error al eliminar el producto: ${error.message}`);
          }
          persist({ sales, clients, products: allProducts.map((prod) => (prod.id === id ? archivedProduct : prod)) });
          return;
        }

        if (isDemo) {
          persist({ sales, clients, products: allProducts.filter((p) => p.id !== id) });
          return;
        }

        const session = await requireActiveSession();

        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", id)
          .eq("user_id", session.user.id);
        if (error) {
          console.error("Error deleting product:", error);
          throw new Error(`Error al eliminar el producto: ${error.message}`);
        }

        persist({ sales, clients, products: allProducts.filter((p) => p.id !== id) });
      },
      updateProduct: async (p) => {
        if (isDemo) {
          persist({
            sales,
            clients,
            products: allProducts.map((prod) => (prod.id === p.id ? p : prod)),
          });
          return;
        }

        const session = await requireActiveSession();

        const { error } = await supabase
          .from("products")
          .update({
            name: p.name,
            cost: p.cost,
            distributor_price: p.distributorPrice,
            public_price: p.publicPrice,
            stock: p.stock,
            track_stock: tracksStock(p),
            needs_cost: Boolean(p.needsCost),
            archived: Boolean(p.archived),
          })
          .eq("id", p.id)
          .eq("user_id", session.user.id);

        if (error) {
          console.error("Error updating product:", error);
          throw new Error(`Error al actualizar el producto: ${error.message}`);
        }

        persist({
          sales,
          clients,
          products: allProducts.map((prod) => (prod.id === p.id ? p : prod)),
        });
      },
      inventoryEnabled,
      setInventoryEnabled: async (enabled) => {
        // Los de "solo esta venta" nunca llevan inventario.
        const nextProducts = allProducts.map((prod) =>
          prod.archived ? prod : { ...prod, trackStock: enabled },
        );
        if (isDemo) {
          persist({ sales, clients, products: nextProducts });
          setInventoryOverride(enabled);
          return;
        }

        const session = await requireActiveSession();

        // Todos los productos del negocio siguen el ajuste (una sola sentencia).
        const { error } = await supabase
          .from("products")
          .update({ track_stock: enabled })
          .eq("user_id", session.user.id)
          .eq("archived", false);
        if (error) {
          console.error("Error updating stock tracking:", error);
          if (/track_stock/.test(error.message)) {
            throw new Error(
              "Falta aplicar la migración de inventario en Supabase (202611190001_optional_stock_tracking.sql).",
            );
          }
          throw new Error(`No se pudo cambiar el inventario: ${error.message}`);
        }

        const { error: metaError } = await supabase.auth.updateUser({
          data: { inventory_enabled: enabled },
        });
        if (metaError) {
          console.error("Error saving inventory setting:", metaError);
          throw new Error(`No se pudo guardar el ajuste: ${metaError.message}`);
        }

        persist({ sales, clients, products: nextProducts });
        setInventoryOverride(enabled);
      },
    }),
    [
      sales,
      clients,
      products,
      allProducts,
      draft,
      lastSaleId,
      inventoryEnabled,
      hasWalkInRow,
      isLoading,
      loadError,
      persist,
      isDemo,
      queryClient,
      queryKey,
    ],
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
