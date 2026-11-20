import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CaretRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SpinnerGapIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useArtisan } from "@/lib/artisan-store";
import { formatMXN, tracksStock, type Product } from "@/lib/artisan-data";
import { DataLoadError, DataLoadSkeleton } from "@/components/artisan/DataLoadState";
import { ProductCreationFlow } from "@/components/products/ProductCreationFlow";
import { buttonClass } from "@/components/ui/button-styles";

export const Route = createFileRoute("/productos")({
  head: () => ({ meta: [{ title: "Productos — Grofit" }] }),
  component: Productos,
});

type Stats = { units: number; collected: number };

function Productos() {
  const { products, sales, addProduct, inventoryEnabled, isLoading, loadError } = useArtisan();
  const [q, setQ] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // /productos?editar=<id> abre la hoja (desde la búsqueda o la vieja página de producto).
  useEffect(() => {
    try {
      const id = new URLSearchParams(window.location.search).get("editar");
      if (id) setEditingId(id);
    } catch {
      // sin URL: no pasa nada
    }
  }, []);

  const stats = useMemo(() => {
    const map = new Map<string, Stats>();
    for (const sale of sales) {
      for (const item of sale.items) {
        const row = map.get(item.productId) ?? { units: 0, collected: 0 };
        row.units += item.qty;
        if (sale.payment !== "Cortesía") row.collected += item.qty * item.unitPrice;
        map.set(item.productId, row);
      }
    }
    return map;
  }, [sales]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));
  const missingCost = products.filter((p) => p.needsCost).length;
  const editing = products.find((p) => p.id === editingId) ?? null;

  if (loadError) return <DataLoadError message={loadError} />;
  if (isLoading) return <DataLoadSkeleton variant="list" title="Cargando productos" />;

  return (
    <div className="page-shell mx-auto max-w-[960px] md:px-0 md:pt-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-black tracking-[-0.02em]">Productos</h1>
          <p className="mt-0.5 text-[14px] text-text-muted">
            {products.length === 0
              ? "Se agregan solos cuando vendes."
              : `${products.length} ${products.length === 1 ? "producto" : "productos"}${
                  missingCost ? ` · ${missingCost} sin costo` : ""
                }`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className={buttonClass({ variant: "secondary", size: "md" })}
        >
          <PlusIcon weight="bold" className="h-4 w-4" />
          Nuevo
        </button>
      </header>

      {products.length > 6 && (
        <label className="relative mt-5 block">
          <span className="sr-only">Buscar producto</span>
          <MagnifyingGlassIcon
            weight="bold"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar producto"
            className="h-12 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-[16px] outline-none focus:border-text-primary focus:ring-3 focus:ring-cta/25"
          />
        </label>
      )}

      {products.length === 0 ? (
        <div className="mt-6 border-t-2 border-primary pt-5">
          <p className="text-[16px] font-bold">Todavía no tienes productos</p>
          <p className="mt-1 max-w-[480px] text-[14px] text-text-secondary">
            Cuando registres una venta y escribas lo que vendiste, se guarda aquí. Si prefieres armar tu
            catálogo antes, usa “Nuevo”.
          </p>
        </div>
      ) : (
        <ul className="mt-5 border-t-2 border-primary">
          {filtered.map((p) => {
            const st = stats.get(p.id);
            const perUnit = p.publicPrice - p.cost;
            const parts = [formatMXN(p.publicPrice)];
            if (!p.needsCost) parts.push(`te deja ${formatMXN(perUnit)} c/u`);
            parts.push(st?.units ? `${st.units} ${st.units === 1 ? "vendido" : "vendidos"}` : "sin ventas aún");
            if (inventoryEnabled && tracksStock(p)) parts.push(`quedan ${p.stock}`);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setEditingId(p.id)}
                  className="flex min-h-[64px] w-full items-center gap-3 border-b border-border-soft py-3 text-left transition hover:bg-surface-2"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">{p.name}</span>
                    <span className="block truncate text-[13px] text-text-muted tabular-nums">
                      {parts.join(" · ")}
                    </span>
                  </span>
                  {p.needsCost && (
                    <span className="shrink-0 rounded-sm bg-warning-bg px-2 py-0.5 text-[12px] font-semibold text-warning">
                      Falta el costo
                    </span>
                  )}
                  <CaretRightIcon weight="bold" className="h-4 w-4 shrink-0 text-text-muted" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <ProductSheet
          key={editing.id}
          product={editing}
          stats={stats.get(editing.id)}
          onClose={() => setEditingId(null)}
        />
      )}

      {showAddForm && (
        <ProductCreationFlow onClose={() => setShowAddForm(false)} onCreate={addProduct} />
      )}
      <div className="h-28 md:h-8" />
    </div>
  );
}

function parseMoney(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

/** Hoja para editar un producto: reemplaza la página propia de cada producto. */
function ProductSheet({
  product,
  stats,
  onClose,
}: {
  product: Product;
  stats?: Stats;
  onClose: () => void;
}) {
  const { updateProduct, deleteProduct, inventoryEnabled } = useArtisan();
  const [name, setName] = useState(product.name);
  const [publicPrice, setPublicPrice] = useState(String(product.publicPrice));
  const [distributorPrice, setDistributorPrice] = useState(
    product.distributorPrice === product.publicPrice ? "" : String(product.distributorPrice),
  );
  const [cost, setCost] = useState(product.needsCost ? "" : String(product.cost));
  const [stock, setStock] = useState(String(product.stock));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showStock = inventoryEnabled && tracksStock(product);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const pub = parseMoney(publicPrice);
    const dist = parseMoney(distributorPrice);
    const c = parseMoney(cost);
    const st = Number(stock);
    if (!name.trim()) return setError("El producto necesita un nombre.");
    if (pub === null || Number.isNaN(pub)) return setError("Escribe el precio al público.");
    if (Number.isNaN(dist) || Number.isNaN(c)) return setError("Los precios y el costo deben ser números.");
    if (showStock && (!Number.isFinite(st) || st < 0)) return setError("Las existencias deben ser un número.");
    setSaving(true);
    setError(null);
    try {
      await updateProduct({
        ...product,
        name: name.trim(),
        publicPrice: pub,
        distributorPrice: dist ?? pub,
        cost: c ?? 0,
        needsCost: c === null,
        stock: showStock ? Math.floor(st) : product.stock,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron guardar los cambios.");
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) return setConfirmDelete(true);
    setSaving(true);
    try {
      await deleteProduct(product.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo borrar el producto.");
      setSaving(false);
    }
  };

  const fieldClass =
    "h-12 w-full rounded-md border border-border bg-surface px-3 text-[16px] tabular-nums outline-none focus:border-text-primary focus:ring-3 focus:ring-cta/25";
  const money = (id: string, label: string, value: string, set: (v: string) => void, placeholder: string) => (
    <label htmlFor={id} className="block space-y-1.5">
      <span className="text-[13px] font-bold">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">$</span>
        <input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(e) => set(e.target.value)}
          placeholder={placeholder}
          className={`${fieldClass} pl-7`}
        />
      </span>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-0 bg-primary/45 animate-in fade-in duration-150" />
      <form
        onSubmit={save}
        className="relative w-full max-w-[480px] rounded-t-lg bg-surface px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_12px_32px_rgba(17,17,17,0.12)] animate-in slide-in-from-bottom-6 duration-200 md:rounded-lg md:pb-5"
      >
        <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-border md:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="sheet-title" className="truncate text-[22px] font-black">{product.name}</h2>
            <p className="text-[13px] text-text-muted tabular-nums">
              {stats?.units
                ? `${stats.units} vendidos · ${formatMXN(stats.collected)} cobrados`
                : "Sin ventas aún"}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="-mr-2 grid h-11 w-11 place-items-center rounded-md hover:bg-surface-2">
            <XIcon weight="bold" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <label htmlFor="sheet-name" className="block space-y-1.5">
            <span className="text-[13px] font-bold">Nombre</span>
            <input id="sheet-name" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            {money("sheet-public", "Precio público", publicPrice, setPublicPrice, "0")}
            {money("sheet-dist", "Precio mayoreo", distributorPrice, setDistributorPrice, "Igual al público")}
          </div>
          <div>
            {money("sheet-cost", "Costo c/u", cost, setCost, "¿Cuánto te cuesta?")}
            {product.needsCost && (
              <p className="mt-1.5 text-[12px] text-warning">
                Sin costo, sus ventas no cuentan para “cuánto te dejó”.
              </p>
            )}
          </div>
          {showStock && (
            <label htmlFor="sheet-stock" className="block space-y-1.5">
              <span className="text-[13px] font-bold">Existencias</span>
              <input id="sheet-stock" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} className={fieldClass} />
            </label>
          )}
        </div>

        {error && <p role="alert" className="mt-3 text-[13px] font-semibold text-danger">{error}</p>}

        <button type="submit" disabled={saving} className={buttonClass({ variant: "primary", size: "lg", block: true, className: "mt-5" })}>
          {saving ? <SpinnerGapIcon weight="bold" className="h-5 w-5 animate-spin" /> : null}
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={saving}
          className="mt-2 h-11 w-full rounded-md text-[14px] font-semibold text-danger hover:bg-danger-bg"
        >
          {confirmDelete ? "Toca otra vez para borrarlo" : "Borrar producto"}
        </button>
      </form>
    </div>
  );
}
