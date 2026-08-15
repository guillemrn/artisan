import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useArtisan } from "@/lib/artisan-store";
import { formatMXN, formatMXNc, type Product } from "@/lib/artisan-data";
import {
  ArrowLeft,
  Pencil,
  TrendingUp,
  Package,
  Banknote,
  Calendar,
  Receipt,
  Store,
  User,
  Filter,
  DollarSign,
  PieChart,
  Loader2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ModalSuccessState } from "@/components/ui/ModalSuccessState";

export const Route = createFileRoute("/productos_/$productId")({
  head: () => ({ meta: [{ title: "Detalle Producto — Artisan" }] }),
  component: ProductDetail,
});

function ProductDetail() {
  const { productId } = Route.useParams();
  const { products, sales, updateProduct } = useArtisan();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<"all" | "month">("all");

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editDistPrice, setEditDistPrice] = useState("");
  const [editPubPrice, setEditPubPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editedProductSuccess, setEditedProductSuccess] = useState<Product | null>(null);

  const product = products.find((p) => p.id === productId);

  // Statistics calculation for product
  const stats = useMemo(() => {
    if (!product) {
      return {
        totalSoldQty: 0,
        totalSalesAmount: 0,
        totalCostAmount: 0,
        totalProfitAmount: 0,
        channelPDV: { qty: 0, revenue: 0 },
        channelPublico: { qty: 0, revenue: 0 },
        clientStatsMap: [] as { clientId: string; clientName: string; channel: "PDV" | "Público"; qty: number; total: number }[],
        productSales: [],
      };
    }

    let totalSoldQty = 0;
    let totalSalesAmount = 0;
    let totalCostAmount = 0;

    let pdvQty = 0;
    let pdvRevenue = 0;
    let publicoQty = 0;
    let publicoRevenue = 0;

    const clientsMap: Record<
      string,
      { clientId: string; clientName: string; channel: "PDV" | "Público"; qty: number; total: number }
    > = {};

    const matchingSales: {
      saleId: string;
      createdAt: string;
      clientId: string;
      clientName: string;
      channel: "PDV" | "Público";
      payment: string;
      qty: number;
      unitPrice: number;
      itemTotal: number;
    }[] = [];

    sales.forEach((s) => {
      s.items.forEach((item) => {
        if (item.productId === product.id) {
          const itemTotal = item.qty * item.unitPrice;
          const itemCost = item.qty * item.cost;

          totalSoldQty += item.qty;
          totalSalesAmount += itemTotal;
          totalCostAmount += itemCost;

          if (s.channel === "PDV") {
            pdvQty += item.qty;
            pdvRevenue += itemTotal;
          } else {
            publicoQty += item.qty;
            publicoRevenue += itemTotal;
          }

          if (!clientsMap[s.clientId]) {
            clientsMap[s.clientId] = {
              clientId: s.clientId,
              clientName: s.clientName,
              channel: s.channel,
              qty: 0,
              total: 0,
            };
          }
          clientsMap[s.clientId].qty += item.qty;
          clientsMap[s.clientId].total += itemTotal;

          matchingSales.push({
            saleId: s.id,
            createdAt: s.createdAt,
            clientId: s.clientId,
            clientName: s.clientName,
            channel: s.channel,
            payment: s.payment,
            qty: item.qty,
            unitPrice: item.unitPrice,
            itemTotal,
          });
        }
      });
    });

    matchingSales.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const clientStatsArray = Object.values(clientsMap).sort((a, b) => b.total - a.total);

    return {
      totalSoldQty,
      totalSalesAmount,
      totalCostAmount,
      totalProfitAmount: totalSalesAmount - totalCostAmount,
      channelPDV: { qty: pdvQty, revenue: pdvRevenue },
      channelPublico: { qty: publicoQty, revenue: publicoRevenue },
      clientStatsMap: clientStatsArray,
      productSales: matchingSales,
    };
  }, [product, sales]);

  const filteredSales = useMemo(() => {
    if (filter === "all") return stats.productSales;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return stats.productSales.filter((s) => new Date(s.createdAt) >= oneMonthAgo);
  }, [stats.productSales, filter]);

  if (!product) {
    return (
      <div className="page-shell flex flex-col items-center justify-center h-[50vh]">
        <p className="text-text-muted mb-4">Producto no encontrado</p>
        <button
          onClick={() => navigate({ to: "/productos" })}
          className="text-primary font-bold hover:underline"
        >
          Volver a productos
        </button>
      </div>
    );
  }

  let stockStatus: "ok" | "low" | "none" = "ok";
  if (product.stock === 0) stockStatus = "none";
  else if (product.stock <= 5) stockStatus = "low";

  const markupPDV =
    product.cost > 0 ? (((product.distributorPrice - product.cost) / product.cost) * 100).toFixed(1) : "0.0";
  const markupPub =
    product.cost > 0 ? (((product.publicPrice - product.cost) / product.cost) * 100).toFixed(1) : "0.0";

  const handleOpenEdit = () => {
    setEditName(product.name);
    setEditCost(String(product.cost));
    setEditDistPrice(String(product.distributorPrice));
    setEditPubPrice(String(product.publicPrice));
    setEditStock(String(product.stock));
    setEditedProductSuccess(null);
    setIsSubmittingEdit(false);
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditedProductSuccess(null);
    setIsSubmittingEdit(false);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || isSubmittingEdit) return;

    setIsSubmittingEdit(true);

    setTimeout(() => {
      const updated: Product = {
        id: product.id,
        name: editName.trim(),
        cost: parseFloat(editCost) || 0,
        distributorPrice: parseFloat(editDistPrice) || 0,
        publicPrice: parseFloat(editPubPrice) || 0,
        stock: parseInt(editStock) || 0,
      };

      updateProduct(updated);
      setIsSubmittingEdit(false);
      setEditedProductSuccess(updated);
    }, 500);
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="page-shell md:px-0 md:pt-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/productos"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border text-text-muted transition hover:text-primary hover:-translate-x-0.5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[24px] font-bold leading-tight text-text-primary truncate">
                {product.name}
              </h1>
              <span
                className={`rounded-full text-[10px] font-bold px-2.5 py-0.5 whitespace-nowrap ${
                  stockStatus === "ok"
                    ? "bg-primary-light text-primary"
                    : stockStatus === "low"
                      ? "bg-[#FEF3C7] text-[#D97706]"
                      : "bg-red-50 text-red-600"
                }`}
              >
                {stockStatus === "ok"
                  ? `${product.stock} en stock`
                  : stockStatus === "low"
                    ? `Bajo stock (${product.stock})`
                    : "Agotado"}
              </span>
            </div>
            <p className="text-[12px] text-text-muted mt-0.5">ID: #{product.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenEdit}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-white px-3.5 text-[13px] font-bold text-text-primary shadow-sm transition hover:bg-muted"
          >
            <Pencil className="h-4 w-4 text-primary" />
            <span>Editar producto</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <div className="rounded-2xl border border-black/[0.05] bg-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(15,23,42,0.03)]">
          <div className="mb-1.5 flex items-center gap-1.5 text-primary">
            <Banknote className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Ventas Totales</span>
          </div>
          <p className="text-[22px] font-extrabold leading-tight text-text-primary font-display">
            {formatMXN(stats.totalSalesAmount)}
          </p>
          <p className="text-[12px] text-text-muted font-medium mt-1">
            {stats.totalSoldQty} {stats.totalSoldQty === 1 ? "unidad vendida" : "unidades vendidas"}
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.05] bg-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(15,23,42,0.03)] relative overflow-hidden">
          <div className="mb-1.5 flex items-center gap-1.5 text-emerald-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Ganancia Acumulada</span>
          </div>
          <p className="text-[22px] font-extrabold leading-tight text-emerald-600 font-display">
            {formatMXN(stats.totalProfitAmount)}
          </p>
          <p className="text-[12px] text-text-muted font-medium mt-1 truncate">
            Margen público: <span className="font-bold text-emerald-600">+{markupPub}%</span>
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.05] bg-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(15,23,42,0.03)]">
          <div className="mb-1.5 flex items-center gap-1.5 text-[#C9784A]">
            <Package className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Stock Disponible</span>
          </div>
          <p className="text-[22px] font-extrabold leading-tight text-text-primary font-display">
            {product.stock} <span className="text-[13px] font-medium text-text-muted">uds</span>
          </p>
          <p className="text-[12px] text-text-muted font-medium mt-1 truncate">
            Valor costo: {formatMXN(product.stock * product.cost)}
          </p>
        </div>

        <div className="rounded-2xl border border-black/[0.05] bg-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(15,23,42,0.03)]">
          <div className="mb-1.5 flex items-center gap-1.5 text-sky-600">
            <DollarSign className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Valor Venta Stock</span>
          </div>
          <p className="text-[22px] font-extrabold leading-tight text-sky-600 font-display">
            {formatMXN(product.stock * product.publicPrice)}
          </p>
          <p className="text-[12px] text-text-muted font-medium mt-1 truncate">
            Valor PDV: {formatMXN(product.stock * product.distributorPrice)}
          </p>
        </div>
      </div>

      {/* Pricing & Cost breakdown Card */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PieChart className="h-4.5 w-4.5 text-primary" />
            <h2 className="text-[16px] font-bold text-text-primary">Estructura de Precios y Costos</h2>
          </div>
          <button
            onClick={handleOpenEdit}
            className="text-[12px] font-bold text-primary hover:underline flex items-center gap-1"
          >
            <Pencil className="h-3.5 w-3.5" /> Modificar valores
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-muted/60 p-4 border border-border/70">
            <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">
              Costo de Producción
            </span>
            <p className="text-[24px] font-bold text-text-primary mt-1">{formatMXNc(product.cost)}</p>
            <p className="text-[12px] text-text-muted mt-1">Costo unitario registrado</p>
          </div>

          <div className="rounded-xl bg-primary-light/40 p-4 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-primary">
                Precio Distribuidor (PDV)
              </span>
              <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">
                +{markupPDV}%
              </span>
            </div>
            <p className="text-[24px] font-bold text-primary mt-1">
              {formatMXNc(product.distributorPrice)}
            </p>
            <p className="text-[12px] text-primary/80 mt-1">
              Ganancia unitaria: {formatMXNc(product.distributorPrice - product.cost)}
            </p>
          </div>

          <div className="rounded-xl bg-[#FBF0E8] p-4 border border-[#C9784A]/20">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#C9784A]">
                Precio Público Final
              </span>
              <span className="text-[10px] font-bold bg-[#C9784A] text-white px-2 py-0.5 rounded-full">
                +{markupPub}%
              </span>
            </div>
            <p className="text-[24px] font-bold text-[#C9784A] mt-1">
              {formatMXNc(product.publicPrice)}
            </p>
            <p className="text-[12px] text-[#C9784A]/80 mt-1">
              Ganancia unitaria: {formatMXNc(product.publicPrice - product.cost)}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown by Channel & Top Purchasing Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Channel Breakdown */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="text-[16px] font-bold text-text-primary mb-4 flex items-center gap-2">
            <Store className="h-4.5 w-4.5 text-primary" /> Ventas por Canal
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center text-[13px] mb-1">
                <span className="font-semibold text-primary flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5" /> Punto de Venta (PDV)
                </span>
                <span className="font-bold text-text-primary">
                  {stats.channelPDV.qty} uds ({formatMXN(stats.channelPDV.revenue)})
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${
                      stats.totalSoldQty > 0
                        ? Math.round((stats.channelPDV.qty / stats.totalSoldQty) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-[13px] mb-1">
                <span className="font-semibold text-[#C9784A] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Público Directo
                </span>
                <span className="font-bold text-text-primary">
                  {stats.channelPublico.qty} uds ({formatMXN(stats.channelPublico.revenue)})
                </span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#C9784A] transition-all"
                  style={{
                    width: `${
                      stats.totalSoldQty > 0
                        ? Math.round((stats.channelPublico.qty / stats.totalSoldQty) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Purchasing Clients */}
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="text-[16px] font-bold text-text-primary mb-4 flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-primary" /> Clientes Principales
          </h2>

          {stats.clientStatsMap.length === 0 ? (
            <p className="text-[13px] text-text-muted py-4 text-center">
              Aún no hay ventas registradas de este producto.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {stats.clientStatsMap.slice(0, 5).map((c) => (
                <li key={c.clientId} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <Link
                    to="/clientes/$clientId"
                    params={{ clientId: c.clientId }}
                    className="flex items-center gap-2 min-w-0 hover:text-primary transition"
                  >
                    <span
                      className={`rounded-full text-[9px] font-bold px-2 py-0.5 shrink-0 ${
                        c.channel === "PDV" ? "bg-primary-light text-primary" : "bg-[#FBF0E8] text-[#C9784A]"
                      }`}
                    >
                      {c.channel}
                    </span>
                    <span className="truncate text-[13px] font-bold text-text-primary hover:text-primary">
                      {c.clientName}
                    </span>
                  </Link>
                  <div className="text-right shrink-0">
                    <p className="text-[13px] font-bold text-text-primary">{formatMXN(c.total)}</p>
                    <p className="text-[11px] text-text-muted">{c.qty} uds</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Ticket/Sales History Section */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm mb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" /> Historial de Tickets
            </h2>
            <p className="text-[13px] text-text-muted">
              Listado de ventas que incluyen {product.name}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Filter className="h-4 w-4 text-text-muted" />
            <div className="flex rounded-xl border border-border bg-muted p-0.5 text-[12px] font-semibold">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-lg px-3 py-1 transition ${
                  filter === "all" ? "bg-white text-text-primary shadow-xs" : "text-text-muted hover:text-text-primary"
                }`}
              >
                Todas ({stats.productSales.length})
              </button>
              <button
                onClick={() => setFilter("month")}
                className={`rounded-lg px-3 py-1 transition ${
                  filter === "month" ? "bg-white text-text-primary shadow-xs" : "text-text-muted hover:text-text-primary"
                }`}
              >
                Último mes
              </button>
            </div>
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div className="py-12 text-center text-text-muted">
            <Receipt className="h-10 w-10 mx-auto opacity-30 mb-2" />
            <p className="text-[14px]">No se encontraron ventas para este período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  <th className="pb-3 font-bold">Fecha</th>
                  <th className="pb-3 font-bold">Cliente</th>
                  <th className="pb-3 font-bold">Canal</th>
                  <th className="pb-3 font-bold text-center">Cantidad</th>
                  <th className="pb-3 font-bold text-right">Precio Unit.</th>
                  <th className="pb-3 font-bold text-right">Total Ticket</th>
                  <th className="pb-3 font-bold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSales.map((s, idx) => (
                  <tr key={`${s.saleId}-${idx}`} className="hover:bg-muted/40 transition">
                    <td className="py-3 font-medium text-text-primary whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-text-muted" />
                        {formatDate(s.createdAt)}
                      </span>
                    </td>
                    <td className="py-3 font-semibold text-text-primary">
                      <Link
                        to="/clientes/$clientId"
                        params={{ clientId: s.clientId }}
                        className="hover:text-primary transition"
                      >
                        {s.clientName}
                      </Link>
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span
                        className={`rounded-full text-[10px] font-bold px-2 py-0.5 ${
                          s.channel === "PDV" ? "bg-primary-light text-primary" : "bg-[#FBF0E8] text-[#C9784A]"
                        }`}
                      >
                        {s.channel}
                      </span>
                    </td>
                    <td className="py-3 text-center font-bold text-text-primary">{s.qty}</td>
                    <td className="py-3 text-right font-medium text-text-muted">
                      {formatMXNc(s.unitPrice)}
                    </td>
                    <td className="py-3 text-right font-bold text-primary">
                      {formatMXN(s.itemTotal)}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <Link
                        to="/ticket/$saleId"
                        params={{ saleId: s.saleId }}
                        className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
                      >
                        Ver ticket
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {editedProductSuccess ? (
              <ModalSuccessState
                title="¡Producto actualizado!"
                description={`Los cambios en ${editedProductSuccess.name} fueron guardados correctamente.`}
                badgeText="Guardado exitoso"
                onAction={handleCloseEdit}
                actionText="Aceptar y cerrar"
              />
            ) : (
              <div>
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h3 className="text-[18px] font-bold text-text-primary">Editar producto</h3>
                  <button
                    onClick={handleCloseEdit}
                    className="text-[13px] font-bold text-text-muted hover:text-text-primary"
                  >
                    Cancelar
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold text-text-muted uppercase">
                      Nombre del producto
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1.5 h-11 w-full rounded-xl border border-border px-3.5 text-[14px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-text-muted uppercase">
                        Costo unitario ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editCost}
                        onChange={(e) => setEditCost(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-border px-3.5 text-[14px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-text-muted uppercase">
                        Stock actual
                      </label>
                      <input
                        type="number"
                        required
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-border px-3.5 text-[14px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-bold text-text-muted uppercase">
                        P. Distribuidor ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editDistPrice}
                        onChange={(e) => setEditDistPrice(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-border px-3.5 text-[14px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-text-muted uppercase">
                        P. Público ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={editPubPrice}
                        onChange={(e) => setEditPubPrice(e.target.value)}
                        className="mt-1.5 h-11 w-full rounded-xl border border-border px-3.5 text-[14px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmittingEdit}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-bold text-white shadow-md transition hover:bg-[#246448] disabled:opacity-50"
                    >
                      {isSubmittingEdit ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" /> Guardando...
                        </>
                      ) : (
                        "Guardar Cambios"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
