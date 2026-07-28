import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  DollarSign,
  TrendingUp,
  Store,
  User,
  Filter,
} from "lucide-react";
import { useArtisan } from "@/lib/artisan-store";
import { formatMXN, formatMXNc, type Sale, type PaymentMethod } from "@/lib/artisan-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/ventas")({
  head: () => ({ meta: [{ title: "Histórico de Ventas — Artisan" }] }),
  component: VentasPage,
});

function VentasPage() {
  const { sales, updateSaleStatus } = useArtisan();

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | "Entregado" | "Pendiente">("Todos");
  const [paymentFilter, setPaymentFilter] = useState<string>("Todos");

  // Pagination state (default 30 per page)
  const [pageSize, setPageSize] = useState<number>(30);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Expanded sale ID state for mobile
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  // Cobrar Confirmation Modal state
  const [saleToCobrar, setSaleToCobrar] = useState<Sale | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("Efectivo");

  const handleOpenCobrarModal = (sale: Sale) => {
    setSaleToCobrar(sale);
    setSelectedPayment(
      ["Pendiente", "Consignación"].includes(sale.payment) ? "Efectivo" : sale.payment
    );
  };

  // 1. Filter and sort sales
  const filteredSales = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return sales
      .filter((s) => {
        const matchesSearch =
          !q ||
          s.clientName.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.items.some((i) => i.productName.toLowerCase().includes(q));

        const matchesStatus = statusFilter === "Todos" || s.status === statusFilter;
        const matchesPayment = paymentFilter === "Todos" || s.payment === paymentFilter;

        return matchesSearch && matchesStatus && matchesPayment;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sales, searchQuery, statusFilter, paymentFilter]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalAmount = 0;
    let deliveredAmount = 0;
    let pendingAmount = 0;
    let deliveredCount = 0;
    let pendingCount = 0;

    sales.forEach((s) => {
      const itemVal = s.payment === "Cortesía" ? 0 : s.total;
      totalAmount += itemVal;
      if (s.status === "Entregado") {
        deliveredAmount += itemVal;
        deliveredCount++;
      } else {
        pendingAmount += itemVal;
        pendingCount++;
      }
    });

    return {
      totalCount: sales.length,
      totalAmount,
      deliveredAmount,
      deliveredCount,
      pendingAmount,
      pendingCount,
    };
  }, [sales]);

  // 2. Pagination Calculations
  const totalSalesCount = filteredSales.length;
  const totalPages = Math.max(1, Math.ceil(totalSalesCount / pageSize));

  // Ensure current page is valid when filters or pageSize change
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSales = filteredSales.slice(startIndex, endIndex);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="page-shell md:px-0 md:pt-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-text-primary flex items-center gap-2.5">
            <Receipt className="h-6 w-6 text-primary" />
            Histórico Completo de Ventas
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Registro de todas las ventas realizadas desde el inicio de operaciones.
          </p>
        </div>

        <Link
          to="/nueva-venta"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-bold px-4 py-2.5 shadow-sm hover:bg-[#1f523b] transition"
        >
          Registrar Venta
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border/80 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Total Registradas</span>
            <span className="p-1.5 rounded-lg bg-primary-light text-primary">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-text-primary font-display">{formatMXN(summaryMetrics.totalAmount)}</p>
            <p className="text-xs text-text-secondary mt-0.5">{summaryMetrics.totalCount} ventas en total</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-white border border-border/80 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Cobradas / Entregadas</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-emerald-800 font-display">{formatMXN(summaryMetrics.deliveredAmount)}</p>
            <p className="text-xs text-emerald-700 font-medium mt-0.5">{summaryMetrics.deliveredCount} ventas cobradas</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-white border border-border/80 p-4 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Por Cobrar</span>
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-amber-800 font-display">{formatMXN(summaryMetrics.pendingAmount)}</p>
            <p className="text-xs text-amber-700 font-medium mt-0.5">{summaryMetrics.pendingCount} pendientes</p>
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por cliente, id o producto..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-border outline-none transition focus:border-primary focus:ring-1 focus:ring-primary text-xs bg-background"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-border outline-none transition focus:border-primary focus:ring-1 focus:ring-primary text-xs bg-background appearance-none font-medium"
            >
              <option value="Todos">Estado: Todos</option>
              <option value="Entregado">Estado: Entregado</option>
              <option value="Pendiente">Estado: Pendiente</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          </div>

          {/* Payment Method Filter */}
          <div className="relative">
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-border outline-none transition focus:border-primary focus:ring-1 focus:ring-primary text-xs bg-background appearance-none font-medium"
            >
              <option value="Todos">Pago: Todos</option>
              <option value="Efectivo">Pago: Efectivo</option>
              <option value="Transferencia">Pago: Transferencia</option>
              <option value="Consignación">Pago: Consignación</option>
              <option value="Cortesía">Pago: Cortesía</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
          </div>
        </div>

        {/* Paginator Bar Header */}
        <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-text-muted">
          <div>
            Mostrando <span className="font-bold text-text-primary">{totalSalesCount > 0 ? startIndex + 1 : 0}</span> a{" "}
            <span className="font-bold text-text-primary">{Math.min(endIndex, totalSalesCount)}</span> de{" "}
            <span className="font-bold text-text-primary">{totalSalesCount}</span> ventas
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Page Size Select */}
            <div className="flex items-center gap-1.5">
              <span>Ventas por página:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="h-8 px-2 rounded-lg border border-border bg-white text-xs font-bold text-text-primary outline-none focus:border-primary"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Page Navigation Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-border bg-white text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Primera página"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1.5 rounded-lg border border-border bg-white text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-2 font-semibold text-text-primary">
                {validCurrentPage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-border bg-white text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Página siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={validCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-border bg-white text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                title="Última página"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main List / Table */}
      {paginatedSales.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center text-text-muted">
          <Receipt className="h-10 w-10 mx-auto text-text-muted/60 mb-2" />
          <p className="font-semibold text-base">No se encontraron ventas</p>
          <p className="text-xs mt-1">Intenta ajustando los filtros de búsqueda o el estado.</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <ul className="grid gap-3 md:hidden">
            {paginatedSales.map((s) => {
              const open = expandedSaleId === s.id;
              const d = new Date(s.createdAt);
              const dateStr = d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit" });
              const timeStr = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

              return (
                <li key={s.id} className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left cursor-pointer"
                    onClick={() => setExpandedSaleId(open ? null : s.id)}
                  >
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                        s.channel === "PDV" ? "bg-primary-light text-primary" : "bg-[#F5F3FF] text-[#6D28D9]"
                      }`}
                    >
                      {s.channel === "PDV" ? <Store className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[14px] font-bold text-text-primary">{s.clientName}</p>
                      <p className="text-[12px] text-text-muted truncate">
                        {s.items
                          .map((i) => {
                            const list = [];
                            if (i.qty > 0) list.push(`${i.productName} ×${i.qty}`);
                            if (i.returnQty && i.returnQty > 0) list.push(`[Cambio: ${i.productName} ×${i.returnQty}]`);
                            return list.join(" ");
                          })
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        {dateStr} · {timeStr}
                      </p>
                    </div>
                    <div className="shrink-0 text-right flex flex-col items-end gap-1">
                      <p className="text-[14px] font-bold">{formatMXN(s.total)}</p>
                      {s.status === "Entregado" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3" /> Entregado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning text-[10px] font-semibold px-2 py-0.5">
                          <Clock className="h-3 w-3" /> Pendiente
                        </span>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-text-muted transition ml-1 ${open ? "rotate-180" : ""}`} />
                  </button>

                  {open && (
                    <div className="border-t border-border px-4 py-3 space-y-2">
                      <div className="space-y-1.5">
                        {s.items.map((i) => (
                          <div key={i.productId} className="space-y-0.5">
                            {i.qty > 0 && (
                              <div className="flex justify-between text-[13px]">
                                <span>
                                  {i.productName} <span className="text-text-muted">×{i.qty}</span>
                                </span>
                                <span className="font-semibold">{formatMXNc(i.unitPrice * i.qty)}</span>
                              </div>
                            )}
                            {(i.returnQty ?? 0) > 0 && (
                              <div className="flex justify-between text-[12px] text-warning font-medium">
                                <span>
                                  Cambio (Merma): {i.productName} <span className="opacity-70">×{i.returnQty}</span>
                                </span>
                                <span>(Sin costo)</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-border space-y-1 text-[13px]">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Pago</span>
                          <span className="font-semibold">{s.payment}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Ganancia</span>
                          <span className="font-semibold text-success">{formatMXN(s.profit)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border flex gap-2">
                        {s.status === "Pendiente" && (
                          <button
                            type="button"
                            onClick={() => handleOpenCobrarModal(s)}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white text-[13px] font-semibold py-2 transition hover:bg-[#1f523b] cursor-pointer"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Cobrar
                          </button>
                        )}
                        <Link
                          to="/ticket/$saleId"
                          params={{ saleId: s.id }}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted text-text-secondary text-[13px] font-semibold px-4 py-2 transition hover:bg-border"
                        >
                          <Receipt className="h-4 w-4" />
                          Ticket
                        </Link>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-hidden bg-white border border-border rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-gray-50 border-b border-border text-text-muted text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Cliente / PDV</th>
                  <th className="py-3.5 px-4">Canal</th>
                  <th className="py-3.5 px-4">Productos</th>
                  <th className="py-3.5 px-4">Pago</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedSales.map((s) => {
                  const d = new Date(s.createdAt);
                  const dateStr = d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
                  const timeStr = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 px-4 text-text-muted">
                        <div className="font-semibold text-text-primary">{dateStr}</div>
                        <div className="text-[11px] opacity-75">{timeStr}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-text-primary">{s.clientName}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`rounded-full text-[10px] font-bold px-2 py-0.5 ${
                            s.channel === "PDV" ? "bg-primary-light text-primary" : "bg-[#F5F3FF] text-[#6D28D9]"
                          }`}
                        >
                          {s.channel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="space-y-1 truncate">
                          {s.items.map((i) => (
                            <div key={i.productId} className="text-[12px] leading-tight truncate">
                              {i.qty > 0 && (
                                <span>
                                  {i.productName} <span className="text-text-muted">x{i.qty}</span>
                                </span>
                              )}
                              {(i.returnQty ?? 0) > 0 && (
                                <span className="text-warning-dark font-medium ml-1">
                                  [Cambio: {i.productName} x{i.returnQty}]
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary font-medium">{s.payment}</td>
                      <td className="py-3.5 px-4">
                        {s.status === "Entregado" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Entregado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning text-[10px] font-bold px-2.5 py-1">
                            <Clock className="h-3.5 w-3.5" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-text-primary">{formatMXN(s.total)}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex justify-end gap-1.5">
                          {s.status === "Pendiente" && (
                            <button
                              type="button"
                              onClick={() => handleOpenCobrarModal(s)}
                              className="bg-primary hover:bg-[#1f523b] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              Cobrar
                            </button>
                          )}
                          <Link
                            to="/ticket/$saleId"
                            params={{ saleId: s.id }}
                            className="border border-border bg-white hover:bg-muted text-text-secondary text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                          >
                            <Receipt className="h-3 w-3" /> Ticket
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom Paginator Controls */}
          <div className="bg-white border border-border rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-text-muted">
            <div>
              Mostrando <span className="font-bold text-text-primary">{startIndex + 1}</span> a{" "}
              <span className="font-bold text-text-primary">{Math.min(endIndex, totalSalesCount)}</span> de{" "}
              <span className="font-bold text-text-primary">{totalSalesCount}</span> ventas
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span>Ventas por página:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="h-8 px-2 rounded-lg border border-border bg-white text-xs font-bold text-text-primary outline-none focus:border-primary"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={validCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-border bg-white text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Primera página"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-border bg-white text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-2 font-semibold text-text-primary">
                  {validCurrentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-border bg-white text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validCurrentPage >= totalPages}
                  className="p-1.5 rounded-lg border border-border bg-white text-text-secondary hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
                  title="Última página"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal for Cobrar */}
      <Dialog open={!!saleToCobrar} onOpenChange={(open) => !open && setSaleToCobrar(null)}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Confirmar Cobro de Venta
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted mt-1">
              Selecciona el método de pago para registrar el cobro de esta venta.
            </DialogDescription>
          </DialogHeader>

          {saleToCobrar && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 p-4 rounded-xl border border-border/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-text-muted">Cliente:</span>
                  <span className="font-bold text-text-primary">{saleToCobrar.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Fecha:</span>
                  <span className="font-medium text-text-secondary">
                    {new Date(saleToCobrar.createdAt).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Productos:</span>
                  <span className="font-medium text-text-secondary text-right max-w-[200px] truncate">
                    {saleToCobrar.items.map((i) => `${i.productName} (x${i.qty})`).join(", ")}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between items-center text-sm">
                  <span className="text-text-muted font-medium">Monto Total:</span>
                  <span className="text-base font-bold text-emerald-700">{formatMXN(saleToCobrar.total)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["Efectivo", "Transferencia"] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedPayment(method)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                        selectedPayment === method
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-white text-text-secondary hover:bg-gray-50"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSaleToCobrar(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSaleStatus(saleToCobrar.id, "Entregado", selectedPayment);
                    toast.success("Venta marcada como cobrada correctamente");
                    setSaleToCobrar(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#1f523b] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar Cobro
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
