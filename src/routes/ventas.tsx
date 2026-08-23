import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, type Dispatch, type ReactNode, type SetStateAction } from "react";
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
  Loader2,
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
import { ModalSuccessState } from "@/components/ui/ModalSuccessState";
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
  const [isCobrando, setIsCobrando] = useState(false);
  const [cobroSuccess, setCobroSuccess] = useState<{
    saleId: string;
    clientName: string;
    total: number;
    paymentMethod: PaymentMethod;
  } | null>(null);

  const handleOpenCobrarModal = (sale: Sale) => {
    setSaleToCobrar(sale);
    setCobroSuccess(null);
    setIsCobrando(false);
    setSelectedPayment(
      ["Pendiente", "Consignación"].includes(sale.payment) ? "Efectivo" : sale.payment
    );
  };

  const handleCloseCobrarModal = () => {
    setSaleToCobrar(null);
    setCobroSuccess(null);
    setIsCobrando(false);
  };

  const handleConfirmCobro = () => {
    if (!saleToCobrar || isCobrando) return;

    setIsCobrando(true);

    setTimeout(() => {
      updateSaleStatus(saleToCobrar.id, "Entregado", selectedPayment);
      setIsCobrando(false);
      setCobroSuccess({
        saleId: saleToCobrar.id,
        clientName: saleToCobrar.clientName,
        total: saleToCobrar.total,
        paymentMethod: selectedPayment,
      });
      toast.success("Venta marcada como cobrada correctamente");
    }, 600);
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
  const activeFilterCount =
    (statusFilter !== "Todos" ? 1 : 0) + (paymentFilter !== "Todos" ? 1 : 0) + (searchQuery ? 1 : 0);

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
    <div className="page-shell space-y-5 md:px-0 md:pt-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="font-display text-[28px] font-bold leading-tight text-text-primary sm:text-[32px]">
            Ventas
          </h1>
          <p className="mt-1 max-w-[64ch] text-sm leading-6 text-text-secondary">
            Revisa lo vendido, ubica pendientes y abre tickets sin perder el contexto del cliente.
          </p>
        </div>

        <Link
          to="/nueva-venta"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-fab transition hover:bg-[#1f523b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 lg:w-auto"
        >
          <Receipt className="h-4 w-4" />
          Registrar venta
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.95fr_0.95fr]">
        <SummaryCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Ventas registradas"
          value={formatMXN(summaryMetrics.totalAmount)}
          note={`${summaryMetrics.totalCount} ventas en total`}
        />
        <SummaryCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Cobradas"
          value={formatMXN(summaryMetrics.deliveredAmount)}
          note={`${summaryMetrics.deliveredCount} ventas entregadas`}
          tone="success"
        />
        <SummaryCard
          icon={<Clock className="h-4 w-4" />}
          label="Por cobrar"
          value={formatMXN(summaryMetrics.pendingAmount)}
          note={`${summaryMetrics.pendingCount} pendientes`}
          tone="warning"
        />
      </div>

      <div className="rounded-2xl border border-border bg-white shadow-card">
        <div className="grid gap-3 p-3 lg:grid-cols-[minmax(260px,1fr)_180px_190px_auto] lg:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar cliente, producto o folio"
              className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <SelectControl
            label="Estado"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value as typeof statusFilter);
              setCurrentPage(1);
            }}
            options={["Todos", "Entregado", "Pendiente"]}
          />

          <SelectControl
            label="Pago"
            value={paymentFilter}
            onChange={(value) => {
              setPaymentFilter(value);
              setCurrentPage(1);
            }}
            options={["Todos", "Efectivo", "Transferencia", "Consignación", "Cortesía"]}
          />

          <div className="flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-xs font-semibold text-text-secondary">
            <Filter className="h-4 w-4 text-primary" />
            <span>{activeFilterCount} activos</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-3 py-3 text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            <span className="font-bold text-text-primary">{totalSalesCount}</span> ventas
            encontradas
            {totalSalesCount > 0 ? (
              <>
                {" "}
                · {startIndex + 1}-{Math.min(endIndex, totalSalesCount)}
              </>
            ) : null}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">
              <span>Por página</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="h-9 rounded-lg border border-border bg-white px-2 text-xs font-bold text-text-primary outline-none focus:border-primary"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
            <Pager
              currentPage={validCurrentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
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

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3 text-xs text-text-muted shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div>
              Mostrando <span className="font-bold text-text-primary">{startIndex + 1}</span> a{" "}
              <span className="font-bold text-text-primary">{Math.min(endIndex, totalSalesCount)}</span> de{" "}
              <span className="font-bold text-text-primary">{totalSalesCount}</span> ventas
            </div>
            <Pager
              currentPage={validCurrentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </div>
        </>
      )}

      {/* Confirmation Modal for Cobrar */}
      <Dialog open={!!saleToCobrar} onOpenChange={(open) => !open && handleCloseCobrarModal()}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          {cobroSuccess ? (
            <ModalSuccessState
              badgeText="Cobro Registrado"
              title="¡Cobro realizado con éxito!"
              description={
                <span>
                  Se registró el pago de <strong className="font-bold text-text-primary">{formatMXN(cobroSuccess.total)}</strong> para el cliente <strong className="font-bold text-text-primary">{cobroSuccess.clientName}</strong> mediante <strong className="font-bold text-text-primary">{cobroSuccess.paymentMethod}</strong>.
                </span>
              }
              details={[
                { label: "Cliente", value: cobroSuccess.clientName },
                { label: "Monto Cobrado", value: formatMXN(cobroSuccess.total) },
                { label: "Método de Pago", value: cobroSuccess.paymentMethod },
                { label: "Estado Venta", value: "Entregado y Pagado" },
              ]}
              onDone={handleCloseCobrarModal}
              actionText="Entendido"
            />
          ) : (
            <>
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
                          disabled={isCobrando}
                          onClick={() => setSelectedPayment(method)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                            selectedPayment === method
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-white text-text-secondary hover:bg-gray-50"
                          } disabled:opacity-60`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isCobrando}
                      onClick={handleCloseCobrarModal}
                      className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:bg-gray-100 transition cursor-pointer disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isCobrando}
                      onClick={handleConfirmCobro}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#1f523b] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-80"
                    >
                      {isCobrando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Confirmar Cobro</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  note,
  tone = "neutral",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass = {
    neutral: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-warning/10 text-warning",
  }[tone];

  const valueClass = {
    neutral: "text-text-primary",
    success: "text-emerald-600",
    warning: "text-warning",
  }[tone];

  return (
    <article className="rounded-2xl border border-border bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold text-text-muted">{label}</p>
          <p className={`mt-2 font-display text-2xl font-bold leading-none ${valueClass}`}>
            {value}
          </p>
          <p className="mt-2 text-xs font-medium text-text-muted">{note}</p>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${toneClass}`}>
          {icon}
        </span>
      </div>
    </article>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-9 text-sm font-semibold text-text-primary outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {label}: {option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
    </label>
  );
}

function Pager({
  currentPage,
  totalPages,
  setCurrentPage,
}: {
  currentPage: number;
  totalPages: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setCurrentPage(1)}
        disabled={currentPage === 1}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white text-text-secondary transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        title="Primera página"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
        disabled={currentPage === 1}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white text-text-secondary transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        title="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="min-w-14 px-2 text-center font-semibold text-text-primary">
        {currentPage} / {totalPages}
      </span>

      <button
        type="button"
        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
        disabled={currentPage >= totalPages}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white text-text-secondary transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        title="Página siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setCurrentPage(totalPages)}
        disabled={currentPage >= totalPages}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white text-text-secondary transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        title="Última página"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </div>
  );
}
