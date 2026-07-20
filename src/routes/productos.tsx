import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Plus, Package, TrendingUp, Archive } from "lucide-react";
import { useArtisan } from "@/lib/artisan-store";
import { formatMXN, formatMXNc, type Product } from "@/lib/artisan-data";

export const Route = createFileRoute("/productos")({
  head: () => ({ meta: [{ title: "Productos — Artisan" }] }),
  component: Productos,
});

function Productos() {
  const { products, addProduct } = useArtisan();
  const [q, setQ] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [distPrice, setDistPrice] = useState("");
  const [pubPrice, setPubPrice] = useState("");
  const [stock, setStock] = useState("");

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  // Stats calculation
  const totalStockVal = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.cost, 0);
  }, [products]);

  const potentialRevenue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.publicPrice, 0);
  }, [products]);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProd: Product = {
      id: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
      name: name.trim(),
      cost: parseFloat(cost) || 0,
      distributorPrice: parseFloat(distPrice) || 0,
      publicPrice: parseFloat(pubPrice) || 0,
      stock: parseInt(stock) || 0,
    };

    addProduct(newProd);

    // Reset fields
    setName("");
    setCost("");
    setDistPrice("");
    setPubPrice("");
    setStock("");
    setShowAddForm(false);
  };

  return (
    <div className="page-shell md:px-0 md:pt-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wide text-primary">Inventario</p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight text-text-primary">Productos</h1>
          <p className="mt-1 text-[14px] text-text-muted">
            Controla precios, costos y disponibilidad del catálogo.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-[13px] font-bold text-white shadow-[0_10px_22px_rgba(46,125,91,0.18)] transition hover:bg-[#246448] sm:px-4"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo producto</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1 text-text-muted">
            <Package className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Catálogo</span>
          </div>
          <p className="text-[22px] font-bold leading-tight text-text-primary">{products.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1 text-primary">
            <Archive className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Costo</span>
          </div>
          <p className="truncate text-[18px] font-bold leading-tight text-primary">
            {formatMXN(totalStockVal)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1 text-[#C9784A]">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Venta</span>
          </div>
          <p className="truncate text-[18px] font-bold leading-tight text-[#C9784A]">
            {formatMXN(potentialRevenue)}
          </p>
        </div>
      </div>

      <div className="mt-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre de producto..."
          className="h-11 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-[14px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <ul className="mt-4 grid gap-3 pb-24 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((p) => {
          let stockStatus: "ok" | "low" | "none" = "ok";
          if (p.stock === 0) stockStatus = "none";
          else if (p.stock <= 5) stockStatus = "low";

          return (
            <li
              key={p.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(31,43,46,0.08)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-text-primary">{p.name}</h3>
                  <p className="text-[12px] text-text-muted mt-0.5">Stock: {p.stock} unidades</p>
                </div>
                <span
                  className={`rounded-full text-[10px] font-bold px-2.5 py-0.5 ${
                    stockStatus === "ok"
                      ? "bg-primary-light text-primary"
                      : stockStatus === "low"
                        ? "bg-[#FEF3C7] text-[#D97706]"
                        : "bg-red-50 text-red-600"
                  }`}
                >
                  {stockStatus === "ok"
                    ? "En Stock"
                    : stockStatus === "low"
                      ? "Bajo Stock"
                      : "Agotado"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 border-t border-border/70 pt-2 text-[11px]">
                <div>
                  <span className="text-text-muted block">Costo unitario</span>
                  <span className="font-semibold text-text-secondary">{formatMXNc(p.cost)}</span>
                </div>
                <div>
                  <span className="text-text-muted block">P. Distribuidor</span>
                  <span className="font-semibold text-primary">
                    {formatMXNc(p.distributorPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block">P. Público</span>
                  <span className="font-semibold text-[#C9784A]">{formatMXNc(p.publicPrice)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Slide-up add product sheet */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
          <div className="w-full max-w-[390px] md:max-w-[480px] bg-surface rounded-t-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <h3 className="text-[18px] font-bold text-primary">Agregar nuevo producto</h3>
            <form onSubmit={handleCreateProduct} className="mt-4 space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-text-secondary block mb-1">
                  Nombre del producto
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Pan Pita Integral Grande"
                  className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-text-secondary block mb-1">
                    Costo de producción ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="20.50"
                    className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-text-secondary block mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="50"
                    className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-text-secondary block mb-1">
                    Precio Distribuidor ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={distPrice}
                    onChange={(e) => setDistPrice(e.target.value)}
                    placeholder="60.00"
                    className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-text-secondary block mb-1">
                    Precio Público ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pubPrice}
                    onChange={(e) => setPubPrice(e.target.value)}
                    placeholder="75.00"
                    className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-xl border border-border py-3 text-[14px] font-semibold text-text-secondary hover:bg-muted transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-primary text-white py-3 text-[14px] font-semibold shadow-lg hover:bg-emerald-700 transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
