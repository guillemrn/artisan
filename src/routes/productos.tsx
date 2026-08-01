import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Plus, Package, TrendingUp, Archive, Pencil, Loader2 } from "lucide-react";
import { useArtisan } from "@/lib/artisan-store";
import { formatMXN, formatMXNc, type Product } from "@/lib/artisan-data";
import { ModalSuccessState } from "@/components/ui/ModalSuccessState";

export const Route = createFileRoute("/productos")({
  head: () => ({ meta: [{ title: "Productos — Artisan" }] }),
  component: Productos,
});

function Productos() {
  const { products, addProduct, updateProduct } = useArtisan();
  const [q, setQ] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Form states
  const [name, setName] = useState("");
  const [cost, setCost] = useState("");
  const [distPrice, setDistPrice] = useState("");
  const [pubPrice, setPubPrice] = useState("");
  const [stock, setStock] = useState("");
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addedProductSuccess, setAddedProductSuccess] = useState<Product | null>(null);

  // Edit Form states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editDistPrice, setEditDistPrice] = useState("");
  const [editPubPrice, setEditPubPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editedProductSuccess, setEditedProductSuccess] = useState<Product | null>(null);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  // Stats calculation
  const totalStockVal = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.cost, 0);
  }, [products]);

  const potentialRevenue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stock * p.publicPrice, 0);
  }, [products]);

  const handleCloseAddModal = () => {
    setName("");
    setCost("");
    setDistPrice("");
    setPubPrice("");
    setStock("");
    setIsSubmittingAdd(false);
    setAddedProductSuccess(null);
    setShowAddForm(false);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmittingAdd) return;

    setIsSubmittingAdd(true);

    setTimeout(() => {
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
      setIsSubmittingAdd(false);
      setAddedProductSuccess(newProd);
    }, 600);
  };

  const handleStartEdit = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditCost(String(p.cost));
    setEditDistPrice(String(p.distributorPrice));
    setEditPubPrice(String(p.publicPrice));
    setEditStock(String(p.stock));
    setEditedProductSuccess(null);
    setIsSubmittingEdit(false);
  };

  const handleCloseEditModal = () => {
    setEditingProduct(null);
    setEditedProductSuccess(null);
    setIsSubmittingEdit(false);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editName.trim() || isSubmittingEdit) return;

    setIsSubmittingEdit(true);

    setTimeout(() => {
      const updated: Product = {
        id: editingProduct.id,
        name: editName.trim(),
        cost: parseFloat(editCost) || 0,
        distributorPrice: parseFloat(editDistPrice) || 0,
        publicPrice: parseFloat(editPubPrice) || 0,
        stock: parseInt(editStock) || 0,
      };

      updateProduct(updated);
      setIsSubmittingEdit(false);
      setEditedProductSuccess(updated);
    }, 600);
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
              className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(31,43,46,0.08)] relative"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-text-primary">{p.name}</h3>
                    <button
                      onClick={() => handleStartEdit(p)}
                      className="p-1 rounded-md text-text-muted hover:text-primary hover:bg-muted transition cursor-pointer"
                      title="Editar producto"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
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

      {/* Slide-up Add Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 backdrop-blur-xs">
          <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-[390px] md:max-w-[480px] bg-surface rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 mb-6">
            {addedProductSuccess ? (
              <ModalSuccessState
                badgeText="Catálogo Actualizado"
                title={`¡${addedProductSuccess.name} agregado!`}
                description={
                  <span>
                    El producto <strong className="font-bold text-text-primary">{addedProductSuccess.name}</strong> ha sido guardado exitosamente con un stock inicial de <strong className="font-bold text-text-primary">{addedProductSuccess.stock} u.</strong>
                  </span>
                }
                details={[
                  { label: "Precio Distribuidor", value: formatMXN(addedProductSuccess.distributorPrice) },
                  { label: "Precio Público", value: formatMXN(addedProductSuccess.publicPrice) },
                  { label: "Stock Inicial", value: `${addedProductSuccess.stock} unidades` },
                ]}
                onDone={handleCloseAddModal}
                actionText="Entendido"
              />
            ) : (
              <>
                <h3 className="text-[18px] font-bold text-primary">Agregar nuevo producto</h3>
                <form onSubmit={handleCreateProduct} className="mt-4 space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-text-secondary block mb-1">
                      Nombre del producto
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmittingAdd}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Pan Pita Integral Grande"
                      className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background disabled:opacity-60"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-semibold text-text-secondary block mb-1">
                        Costo de producción ($)
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        required
                        disabled={isSubmittingAdd}
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        placeholder="20.50"
                        className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-text-secondary block mb-1">
                        Stock Inicial
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        disabled={isSubmittingAdd}
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="50"
                        className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background disabled:opacity-60"
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
                        disabled={isSubmittingAdd}
                        value={distPrice}
                        onChange={(e) => setDistPrice(e.target.value)}
                        placeholder="60.00"
                        className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background disabled:opacity-60"
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
                        disabled={isSubmittingAdd}
                        value={pubPrice}
                        onChange={(e) => setPubPrice(e.target.value)}
                        placeholder="75.00"
                        className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSubmittingAdd}
                      onClick={handleCloseAddModal}
                      className="flex-1 rounded-xl border border-border py-3 text-[14px] font-semibold text-text-secondary hover:bg-muted transition disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingAdd}
                      className="flex-1 rounded-xl bg-primary text-white py-3 text-[14px] font-semibold shadow-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
                    >
                      {isSubmittingAdd ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        "Guardar"
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Slide-up Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center px-4 backdrop-blur-xs">
          <div className="w-full max-w-[calc(100vw-2rem)] sm:max-w-[390px] md:max-w-[480px] bg-surface rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 mb-6">
            {editedProductSuccess ? (
              <ModalSuccessState
                badgeText="Inventario Actualizado"
                title={`¡${editedProductSuccess.name} actualizado!`}
                description={
                  <span>
                    Se han guardado los cambios y ajustado las existencias a <strong className="font-bold text-text-primary">{editedProductSuccess.stock} unidades</strong>.
                  </span>
                }
                details={[
                  { label: "Producto", value: editedProductSuccess.name },
                  { label: "Stock Disponible", value: `${editedProductSuccess.stock} unidades` },
                  { label: "Precio Público", value: formatMXN(editedProductSuccess.publicPrice) },
                ]}
                onDone={handleCloseEditModal}
                actionText="Entendido"
              />
            ) : (
              <>
                <h3 className="text-[18px] font-bold text-primary">Editar producto e inventario</h3>
                <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-text-secondary block mb-1">
                      Nombre del producto
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSubmittingEdit}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Ej. Pan Pita Integral Grande"
                      className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background disabled:opacity-60"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-semibold text-text-secondary block mb-1">
                        Costo de producción ($)
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        required
                        disabled={isSubmittingEdit}
                        value={editCost}
                        onChange={(e) => setEditCost(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-semibold text-text-secondary block mb-1">
                        Inventario / Stock
                      </label>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        required
                        disabled={isSubmittingEdit}
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background disabled:opacity-60 ring-2 ring-primary/20"
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
                        disabled={isSubmittingEdit}
                        value={editDistPrice}
                        onChange={(e) => setEditDistPrice(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background disabled:opacity-60"
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
                        disabled={isSubmittingEdit}
                        value={editPubPrice}
                        onChange={(e) => setEditPubPrice(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSubmittingEdit}
                      onClick={handleCloseEditModal}
                      className="flex-1 rounded-xl border border-border py-3 text-[14px] font-semibold text-text-secondary hover:bg-muted transition disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingEdit}
                      className="flex-1 rounded-xl bg-primary text-white py-3 text-[14px] font-semibold shadow-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-80"
                    >
                      {isSubmittingEdit ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        "Guardar Cambios"
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
