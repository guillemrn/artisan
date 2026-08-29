import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, useMemo, useEffect } from "react";
import {
  Menu,
  Store,
  User,
  CheckCircle2,
  Clock,
  Receipt,
  Plus,
  Database,
  Calendar,
  Package,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ArrowRight,
  Check,
  Sparkles,
  RefreshCw,
  Search,
  Instagram,
  Monitor,
  Smartphone,
  Users,
  X,
  Download,
  Upload,
  Star,
  Zap,
  Send,
  CheckCircle,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { useArtisan } from "@/lib/artisan-store";
import {
  USER_NAME,
  formatMXN,
  formatMXNc,
  getSalePaymentDate,
  type Sale,
  type PaymentMethod,
  type Product,
  type Client,
} from "@/lib/artisan-data";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/core/auth/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ModalSuccessState } from "@/components/ui/ModalSuccessState";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";

import {
  exportSalesCSV,
  exportClientsCSV,
  exportProductsCSV,
  parseClientsCSV,
  parseProductsCSV,
} from "@/lib/csv";
import { DataLoadError, DataLoadSkeleton } from "@/components/artisan/DataLoadState";
import {
  getSaleItemCost,
  getSaleItemRevenue,
} from "@/lib/artisan-sale-calculations";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Panel — Artisan" }] }),
  component: Home,
});

type TimeFilter = "Hoy" | "Semana" | "Mes" | "Año" | "Todo";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function startOfWeek(d: Date) {
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon-Sun
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  return startOfDay(start);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function startOfYear(d: Date) {
  return new Date(d.getFullYear(), 0, 1).getTime();
}

function isDateInPeriod(date: string | undefined, timeFilter: TimeFilter): boolean {
  if (!date) return false;
  const timestamp = new Date(date).getTime();
  if (timeFilter === "Hoy") return timestamp >= startOfDay(new Date());
  if (timeFilter === "Semana") return timestamp >= startOfWeek(new Date());
  if (timeFilter === "Mes") return timestamp >= startOfMonth(new Date());
  if (timeFilter === "Año") return timestamp >= startOfYear(new Date());
  return true;
}

function Home() {
  const { user } = useAuth();

  const { sales, products, clients, updateSaleStatus, updateProduct, isLoading, loadError } =
    useArtisan();

  // State for filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Hoy");
  const [productFilter, setProductFilter] = useState<string>("Todos");
  const [clientFilter, setClientFilter] = useState<string>("Todos");

  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<"Todos" | "Entregado" | "Pendiente">("Todos");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);

  // States for Cobrar Confirmation & Pending Sales Modals
  const [saleToCobrar, setSaleToCobrar] = useState<Sale | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("Efectivo");
  const [isCobrando, setIsCobrando] = useState(false);
  const [cobroError, setCobroError] = useState<string | null>(null);
  const [isPendingSalesModalOpen, setIsPendingSalesModalOpen] = useState(false);
  const [modalOpenId, setModalOpenId] = useState<string | null>(null);

  // State for Add Inventory Modal
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [addStockValues, setAddStockValues] = useState<Record<string, string>>({});
  const [isSavingAddStock, setIsSavingAddStock] = useState(false);
  const [addStockSuccess, setAddStockSuccess] = useState<{
    totalAdded: number;
    itemsCount: number;
  } | null>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);

  const handleCloseAddStockModal = () => {
    setAddStockValues({});
    setIsAddStockModalOpen(false);
    setAddStockSuccess(null);
    setIsSavingAddStock(false);
  };

  const handleSaveAddStock = async () => {
    if (isSavingAddStock) return;
    setIsSavingAddStock(true);

    try {
      let updatedCount = 0;
      let itemsUpdatedCount = 0;
      for (const p of products) {
        const addedQty = parseInt(addStockValues[p.id] || "0", 10);
        if (addedQty > 0) {
          await updateProduct({ ...p, stock: p.stock + addedQty });
          updatedCount += addedQty;
          itemsUpdatedCount += 1;
        }
      }

      setIsSavingAddStock(false);
      setAddStockSuccess({
        totalAdded: updatedCount,
        itemsCount: itemsUpdatedCount,
      });

      if (updatedCount > 0) {
        toast.success(`Se agregaron ${updatedCount} piezas al inventario`);
      }
    } catch (err) {
      console.error(err);
      setIsSavingAddStock(false);
    }
  };

  const handleOpenCobrarModal = (sale: Sale) => {
    setSaleToCobrar(sale);
    setCobroError(null);
    setIsCobrando(false);
    setSelectedPayment(
      ["Pendiente", "Consignación"].includes(sale.payment) ? "Efectivo" : sale.payment,
    );
  };

  const handleCloseCobrarModal = () => {
    if (isCobrando) return;
    setSaleToCobrar(null);
    setCobroError(null);
  };

  const handleConfirmCobro = async () => {
    if (!saleToCobrar || isCobrando) return;

    setIsCobrando(true);
    setCobroError(null);

    try {
      await updateSaleStatus(saleToCobrar.id, "Entregado", selectedPayment);
      toast.success("Venta marcada como cobrada correctamente");
      setSaleToCobrar(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo registrar el cobro. Inténtalo nuevamente.";
      setCobroError(message);
      toast.error("No se pudo registrar el cobro");
    } finally {
      setIsCobrando(false);
    }
  };

  const allPendingSales = useMemo(() => {
    return sales.filter((s) => s.status === "Pendiente");
  }, [sales]);

  const allPendingSalesTotal = useMemo(() => {
    return allPendingSales.reduce((acc, s) => {
      if (s.payment === "Cortesía") return acc;
      return acc + s.total;
    }, 0);
  }, [allPendingSales]);

  useEffect(() => {
    const completed = localStorage.getItem("onboarding_completed") === "true";
    const shownCount = parseInt(localStorage.getItem("onboarding_shown_count") ?? "0", 10);
    const remindLaterCount = parseInt(
      localStorage.getItem("onboarding_remind_later_count") ?? "0",
      10,
    );

    if (!completed && shownCount < 3 && remindLaterCount < 2) {
      setShowOnboarding(true);
      localStorage.setItem("onboarding_shown_count", String(shownCount + 1));
    }
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  const handleRemindLaterOnboarding = () => {
    const remindLaterCount = parseInt(
      localStorage.getItem("onboarding_remind_later_count") ?? "0",
      10,
    );
    localStorage.setItem("onboarding_remind_later_count", String(remindLaterCount + 1));
    setShowOnboarding(false);
  };

  const dateLabel = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const displayName = user?.user_metadata?.full_name ?? USER_NAME;
  const initials = displayName.slice(0, 2).toUpperCase();

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Buenos días" : currentHour < 19 ? "Buenas tardes" : "Buenas noches";

  const selectedProductLabel = products.find((product) => product.id === productFilter)?.name;
  const selectedClientLabel = clients.find((client) => client.id === clientFilter)?.name;
  const activeFilterCount = [
    timeFilter !== "Hoy",
    productFilter !== "Todos",
    clientFilter !== "Todos",
  ].filter(Boolean).length;
  const filterSummary =
    activeFilterCount === 0
      ? "Hoy"
      : [
          timeFilter,
          productFilter !== "Todos" ? selectedProductLabel : null,
          clientFilter !== "Todos" ? selectedClientLabel : null,
        ]
          .filter(Boolean)
          .join(" · ");

  useEffect(() => {
    if (!filtersOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!filtersRef.current?.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFiltersOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filtersOpen]);

  // 1. Filter Sales by Time
  const deliveryTimeFilteredSales = useMemo(() => {
    return sales.filter((sale) => isDateInPeriod(sale.createdAt, timeFilter));
  }, [sales, timeFilter]);

  const paymentTimeFilteredSales = useMemo(() => {
    return sales.filter((sale) => isDateInPeriod(getSalePaymentDate(sale), timeFilter));
  }, [sales, timeFilter]);

  // 2. Filter Sales by Client
  const clientFilteredSales = useMemo(() => {
    if (clientFilter === "Todos") return deliveryTimeFilteredSales;
    return deliveryTimeFilteredSales.filter((s) => s.clientId === clientFilter);
  }, [deliveryTimeFilteredSales, clientFilter]);

  const paidClientFilteredSales = useMemo(() => {
    if (clientFilter === "Todos") return paymentTimeFilteredSales;
    return paymentTimeFilteredSales.filter((s) => s.clientId === clientFilter);
  }, [paymentTimeFilteredSales, clientFilter]);

  // 3. Filter Sales by Product (Only matching items inside each sale)
  const fullyFilteredSales = useMemo(() => {
    if (productFilter === "Todos") return clientFilteredSales;
    return clientFilteredSales.filter((s) => s.items.some((i) => i.productId === productFilter));
  }, [clientFilteredSales, productFilter]);

  const fullyFilteredPaidSales = useMemo(() => {
    if (productFilter === "Todos") return paidClientFilteredSales;
    return paidClientFilteredSales.filter((s) =>
      s.items.some((i) => i.productId === productFilter),
    );
  }, [paidClientFilteredSales, productFilter]);

  // 4. Filter History Sales by Search and Status
  const historyFilteredSales = useMemo(() => {
    return fullyFilteredSales.filter((s) => {
      const matchesSearch =
        s.clientName.toLowerCase().includes(historySearch.toLowerCase()) ||
        s.id.toLowerCase().includes(historySearch.toLowerCase());
      const matchesStatus = historyStatus === "Todos" || s.status === historyStatus;
      return matchesSearch && matchesStatus;
    });
  }, [fullyFilteredSales, historySearch, historyStatus]);

  // --- KPIs Calculations ---
  const kpiData = useMemo(() => {
    let salesTotal = 0;
    let costTotal = 0;
    let pendingSalesTotal = 0;
    let packagesTotal = 0;
    let returnsTotal = 0;
    const productQuantities: Record<string, number> = {};

    fullyFilteredPaidSales.forEach((s) => {
      s.items.forEach((item) => {
        if (productFilter === "Todos" || item.productId === productFilter) {
          const itemTotal = getSaleItemRevenue(item, s.payment);
          const itemCost = getSaleItemCost(item);

          salesTotal += itemTotal;
          costTotal += itemCost;
        }
      });
    });

    fullyFilteredSales.forEach((s) => {
      s.items.forEach((item) => {
        if (productFilter === "Todos" || item.productId === productFilter) {
          const itemTotal = getSaleItemRevenue(item, s.payment);

          if (s.status === "Pendiente") pendingSalesTotal += itemTotal;

          packagesTotal += item.qty;
          returnsTotal += item.returnQty ?? 0;

          productQuantities[item.productName] =
            (productQuantities[item.productName] ?? 0) + item.qty;
        }
      });
    });

    const profitTotal = salesTotal - costTotal;
    const margin = salesTotal > 0 ? Math.round((profitTotal / salesTotal) * 100) : 0;

    // Find top product
    let topProduct = "N/A";
    let maxQty = 0;
    Object.entries(productQuantities).forEach(([name, qty]) => {
      if (qty > maxQty) {
        maxQty = qty;
        topProduct = name;
      }
    });

    return {
      salesTotal,
      costTotal,
      profitTotal,
      pendingSalesTotal,
      margin,
      packagesTotal,
      returnsTotal,
      topProduct,
      maxQty,
    };
  }, [fullyFilteredSales, fullyFilteredPaidSales, productFilter]);

  // --- Product Economy Table calculations ---
  const productPerformance = useMemo(() => {
    return products.map((prod) => {
      let salesAmount = 0;
      let costAmount = 0;
      let qtySold = 0;

      // Calculate aggregated metrics from clientFilteredSales (so it respects time and client filters)
      clientFilteredSales.forEach((s) => {
        s.items.forEach((item) => {
          if (item.productId === prod.id) {
            salesAmount += getSaleItemRevenue(item, s.payment);
            costAmount += getSaleItemCost(item);
            qtySold += item.qty;
          }
        });
      });

      const profitAmount = salesAmount - costAmount;
      const margin = salesAmount > 0 ? Math.round((profitAmount / salesAmount) * 100) : 0;

      return {
        id: prod.id,
        name: prod.name,
        cost: prod.cost,
        distributorPrice: prod.distributorPrice,
        publicPrice: prod.publicPrice,
        salesAmount,
        costAmount,
        profitAmount,
        margin,
        qtySold,
      };
    });
  }, [products, clientFilteredSales]);

  const clientMovement = useMemo(() => {
    const map: Record<string, { name: string; packages: number; total: number }> = {};

    fullyFilteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (productFilter === "Todos" || item.productId === productFilter) {
          const current = map[sale.clientId] ?? {
            name: sale.clientName,
            packages: 0,
            total: 0,
          };
          current.packages += item.qty;
          current.total += getSaleItemRevenue(item, sale.payment);
          map[sale.clientId] = current;
        }
      });
    });

    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [fullyFilteredSales, productFilter]);

  // --- Recharts Chart Data Generation ---

  // 1. Tendencia Diaria Chart
  const trendChartData = useMemo(() => {
    const dailyMap: Record<string, number> = {};

    // Sort chronological order
    const sortedSales = [...fullyFilteredPaidSales].sort(
      (a, b) =>
        new Date(getSalePaymentDate(a) ?? 0).getTime() -
        new Date(getSalePaymentDate(b) ?? 0).getTime(),
    );

    sortedSales.forEach((s) => {
      const dateKey = new Date(getSalePaymentDate(s) ?? s.createdAt).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
      });

      // Sum only matching items if product filter active
      let val = 0;
      s.items.forEach((item) => {
        if (productFilter === "Todos" || item.productId === productFilter) {
          val += getSaleItemRevenue(item, s.payment);
        }
      });

      dailyMap[dateKey] = (dailyMap[dateKey] ?? 0) + val;
    });

    return Object.entries(dailyMap).map(([fecha, total]) => ({
      fecha,
      Ventas: total,
    }));
  }, [fullyFilteredPaidSales, productFilter]);

  const productChartData = useMemo(() => {
    return productPerformance
      .filter((product) => product.qtySold > 0)
      .sort((a, b) => b.qtySold - a.qtySold)
      .map((product) => ({
        name: product.name,
        paquetes: product.qtySold,
        venta: product.salesAmount,
      }));
  }, [productPerformance]);

  const clientChartData = useMemo(() => {
    return clientMovement.slice(0, 5).map((client) => ({
      name: client.name,
      paquetes: client.packages,
      venta: client.total,
    }));
  }, [clientMovement]);

  if (loadError) {
    return <DataLoadError message={loadError} />;
  }

  if (isLoading) {
    return <DataLoadSkeleton variant="dashboard" />;
  }

  return (
    <div className="page-shell space-y-5 md:px-0 md:pt-6">
      {csvOpen && <CSVSheet onClose={() => setCsvOpen(false)} />}

      {/* Dashboard Header */}
      <section className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold capitalize text-text-muted">{dateLabel}</p>
            <h1 className="mt-1 font-display text-[28px] font-bold leading-tight text-text-primary md:text-[34px]">
              {greeting}, {displayName}
            </h1>
            <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-text-secondary md:text-[15px]">
              Ventas, pendientes, inventario y margen del día.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:gap-2.5">
            <FilterDropdown
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
              refEl={filtersRef}
              activeCount={activeFilterCount}
              summary={filterSummary}
              timeFilter={timeFilter}
              productFilter={productFilter}
              clientFilter={clientFilter}
              products={products}
              clients={clients}
              onTimeChange={(value) => setTimeFilter(value as TimeFilter)}
              onProductChange={setProductFilter}
              onClientChange={setClientFilter}
            />
            <button
              type="button"
              onClick={() => setIsAddStockModalOpen(true)}
              className="inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 text-[13px] font-bold text-text-primary transition hover:bg-muted active:scale-[0.99] sm:w-auto sm:px-4 sm:text-[14px]"
            >
              <Package className="h-4 w-4 shrink-0" />
              <span className="truncate">Agregar inventario</span>
            </button>
            <Link
              to="/nueva-venta"
              className="hidden h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[14px] font-bold text-white transition hover:bg-[#1f523b] active:scale-[0.99] md:inline-flex"
            >
              <Plus className="h-4 w-4" />
              Nueva venta
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Overview */}
      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Ventas cobradas"
            value={formatMXN(kpiData.salesTotal)}
            sub={`${fullyFilteredPaidSales.length} cobradas`}
            icon={<DollarSign className="h-4 w-4" />}
            accent="green"
          />
          <Kpi
            label="Costos totales"
            value={formatMXN(kpiData.costTotal)}
            sub="entregados y cortesias"
            icon={<DollarSign className="h-4 w-4" />}
            accent="red"
          />
          <Kpi
            label="Ganancia neta"
            value={formatMXN(kpiData.profitTotal)}
            sub={`${kpiData.margin}% margen util`}
            icon={<TrendingUp className="h-4 w-4" />}
            accent="green"
          />
          <Kpi
            label="Por cobrar"
            value={formatMXN(kpiData.pendingSalesTotal)}
            sub={`${fullyFilteredSales.filter((s) => s.status === "Pendiente").length} pendientes`}
            icon={<DollarSign className="h-4 w-4" />}
            accent="amber"
            onClick={() => setIsPendingSalesModalOpen(true)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Kpi
            label="Top producto"
            value={kpiData.topProduct}
            sub={kpiData.maxQty > 0 ? `${kpiData.maxQty} paquetes` : "Sin ventas"}
            icon={<Package className="h-4 w-4" />}
            accent="blue"
          />
          <Kpi
            label="Paquetes entregados"
            value={String(kpiData.packagesTotal)}
            sub="en el periodo"
            icon={<CheckCircle2 className="h-4 w-4" />}
            accent="green"
          />
          <Kpi
            label="Productos cambiados"
            value={String(kpiData.returnsTotal)}
            sub="cambios / devoluciones"
            icon={<RefreshCw className="h-4 w-4" />}
            accent="amber"
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="flex h-[300px] flex-col rounded-2xl border border-border bg-white p-4">
          <div className="mb-4">
            <h3 className="font-display text-base font-bold text-text-primary">Ritmo de ventas</h3>
            <p className="text-[13px] text-text-muted">Cómo se movió el dinero cobrado</p>
          </div>
          <div className="min-h-0 flex-1 text-xs">
            {trendChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-text-muted">
                Sin datos en el periodo
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#23684a" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#23684a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECEFF2" />
                  <XAxis dataKey="fecha" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={44} />
                  <RechartsTooltip formatter={(value) => formatMXN(Number(value))} />
                  <Area
                    type="monotone"
                    dataKey="Ventas"
                    stroke="#23684a"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVentas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <ChartPanel
          title="Ventas por producto"
          subtitle="Paquetes vendidos por producto"
          empty={productChartData.length === 0}
        >
          <BarChart
            layout="vertical"
            data={productChartData}
            margin={{ left: 4, right: 8, top: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ECEFF2" />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={108}
              tickFormatter={(value) => (value.length > 16 ? `${value.slice(0, 14)}...` : value)}
            />
            <RechartsTooltip
              formatter={(value, name) =>
                name === "venta" ? formatMXN(Number(value)) : `${value} paquetes`
              }
            />
            <Bar dataKey="paquetes" radius={[0, 5, 5, 0]}>
              {productChartData.map((_entry, index) => (
                <Cell key={`product-cell-${index}`} fill={index === 0 ? "#23684a" : "#9CA3AF"} />
              ))}
            </Bar>
          </BarChart>
        </ChartPanel>

        <ChartPanel
          title="Top clientes / PDV"
          subtitle="Dónde se concentró el movimiento"
          empty={clientChartData.length === 0}
        >
          <BarChart
            layout="vertical"
            data={clientChartData}
            margin={{ left: 4, right: 8, top: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ECEFF2" />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={108}
              tickFormatter={(value) => (value.length > 16 ? `${value.slice(0, 14)}...` : value)}
            />
            <RechartsTooltip
              formatter={(value, name) =>
                name === "venta" ? formatMXN(Number(value)) : `${value} paquetes`
              }
            />
            <Bar dataKey="paquetes" fill="#23684a" radius={[0, 5, 5, 0]} />
          </BarChart>
        </ChartPanel>
      </section>

      {/* Recientes/Historial list */}
      <div className="mt-7 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-text-primary">
              Historial de Ventas
            </h3>
            <p className="text-[13px] text-text-muted">
              Transacciones que coinciden con los filtros
            </p>
          </div>
          {/* Filters for Sales History */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-initial min-w-[155px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full h-9 pl-8 pr-2.5 rounded-lg border border-border text-[12px] outline-none bg-white focus:border-primary"
              />
            </div>
            <select
              value={historyStatus}
              onChange={(e) => setHistoryStatus(e.target.value as any)}
              className="h-9 px-2 rounded-lg border border-border text-[12px] font-semibold bg-white outline-none focus:border-primary"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Entregado">Entregado</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>
        </div>

        {historyFilteredSales.length === 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3 text-text-muted py-8 bg-white rounded-2xl border border-border">
            <Receipt className="h-10 w-10 opacity-30" />
            <p className="text-[14px]">Sin ventas registradas</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <ul className="grid gap-2 md:hidden">
              {historyFilteredSales.slice(0, 15).map((s) => (
                <SaleCardItem
                  key={s.id}
                  sale={s}
                  open={openId === s.id}
                  onToggle={() => setOpenId(openId === s.id ? null : s.id)}
                  onCobrar={handleOpenCobrarModal}
                />
              ))}
            </ul>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-border bg-white">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-border text-[12px] font-bold text-text-muted">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Cliente / PDV</th>
                    <th className="py-3 px-4">Canal</th>
                    <th className="py-3 px-4">Productos / Movimientos</th>
                    <th className="py-3 px-4">Pago</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {historyFilteredSales.slice(0, 20).map((s) => {
                    const d = new Date(s.createdAt);
                    const dateStr = d.toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "2-digit",
                    });
                    const timeStr = d.toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4 text-text-muted">
                          <div>{dateStr}</div>
                          <div className="text-[11px] opacity-75">{timeStr}</div>
                          {s.paidAt && s.paidAt !== s.createdAt && (
                            <div className="mt-1 text-[10px] font-semibold text-primary">
                              Cobrado{" "}
                              {new Date(s.paidAt).toLocaleDateString("es-MX", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-text-primary">{s.clientName}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-full text-[10px] font-bold px-2 py-0.5 ${
                              s.channel === "PDV"
                                ? "bg-primary-light text-primary"
                                : "bg-[#F5F3FF] text-[#6D28D9]"
                            }`}
                          >
                            {s.channel}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {s.items.map((i) => (
                              <div key={i.productId} className="text-[12px] leading-tight">
                                {i.qty > 0 && (
                                  <div>
                                    <span className="font-medium text-emerald-800">Entregado:</span>{" "}
                                    {i.productName}{" "}
                                    <span className="text-text-muted">x{i.qty}</span>
                                  </div>
                                )}
                                {(i.returnQty ?? 0) > 0 && (
                                  <div className="text-warning-dark font-medium">
                                    <span>Cambio:</span> {i.productName}{" "}
                                    <span className="opacity-80">x{i.returnQty}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-text-secondary font-medium">{s.payment}</td>
                        <td className="py-3 px-4">
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
                        <td className="py-3 px-4 text-right font-bold tabular-nums text-text-primary">
                          {formatMXN(s.total)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-1.5">
                            {s.status === "Pendiente" && (
                              <button
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
          </>
        )}
      </div>
      {showOnboarding && (
        <OnboardingModal
          onClose={handleCloseOnboarding}
          onRemindLater={handleRemindLaterOnboarding}
        />
      )}

      {/* Modal 1: Confirmation Modal for Cobrar */}
      <Dialog
        open={!!saleToCobrar}
        onOpenChange={(open) => !open && handleCloseCobrarModal()}
      >
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
                  <span className="text-base font-bold text-emerald-700">
                    {formatMXN(saleToCobrar.total)}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[12px] font-semibold text-text-muted">
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

              {cobroError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700"
                >
                  {cobroError}
                </div>
              )}

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
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmar Cobro
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 2: Pending Sales Modal (All Pending Sales) */}
      <Dialog open={isPendingSalesModalOpen} onOpenChange={setIsPendingSalesModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 rounded-2xl">
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex justify-between items-center pr-6">
              <div>
                <DialogTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Ventas Por Cobrar (Todas)
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted mt-0.5">
                  Ventas pendientes de cobro sin importar el filtro de fecha.
                </DialogDescription>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-semibold text-text-muted">Total por cobrar</p>
                <p className="text-lg font-bold tabular-nums text-amber-700">
                  {formatMXN(allPendingSalesTotal)}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-3 pr-1 space-y-3">
            {allPendingSales.length === 0 ? (
              <div className="py-12 text-center text-text-muted">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="font-semibold text-sm">¡No hay ventas pendientes por cobrar!</p>
                <p className="text-xs mt-1">
                  Todas las ventas registradas han sido entregadas y cobradas.
                </p>
              </div>
            ) : (
              <ul className="grid gap-2.5">
                {allPendingSales.map((s) => (
                  <SaleCardItem
                    key={s.id}
                    sale={s}
                    open={modalOpenId === s.id}
                    onToggle={() => setModalOpenId(modalOpenId === s.id ? null : s.id)}
                    onCobrar={handleOpenCobrarModal}
                  />
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Add Inventory Modal */}
      <Dialog
        open={isAddStockModalOpen}
        onOpenChange={(open) => !open && handleCloseAddStockModal()}
      >
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-6 rounded-2xl">
          {addStockSuccess ? (
            <ModalSuccessState
              badgeText="Inventario Actualizado"
              title={
                addStockSuccess.totalAdded > 0
                  ? `¡${addStockSuccess.totalAdded} piezas agregadas!`
                  : "Sin cambios en el inventario"
              }
              description={
                addStockSuccess.totalAdded > 0 ? (
                  <span>
                    Se añadieron con éxito{" "}
                    <strong className="font-bold text-text-primary">
                      +{addStockSuccess.totalAdded} unidades
                    </strong>{" "}
                    repartidas en{" "}
                    <strong className="font-bold text-text-primary">
                      {addStockSuccess.itemsCount} productos
                    </strong>
                    .
                  </span>
                ) : (
                  <span>No se ingresaron cantidades adicionales para sumar al stock.</span>
                )
              }
              details={
                addStockSuccess.totalAdded > 0
                  ? [
                      { label: "Piezas Agregadas", value: `+${addStockSuccess.totalAdded} u.` },
                      { label: "Productos Actualizados", value: `${addStockSuccess.itemsCount}` },
                      { label: "Estado Inventario", value: "Sincronizado" },
                    ]
                  : []
              }
              onDone={handleCloseAddStockModal}
              actionText="Entendido"
            />
          ) : (
            <>
              <DialogHeader className="pb-3 border-b border-border">
                <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  ¿Cuántas piezas deseas agregar a tu inventario?
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted mt-1">
                  Ingresa la cantidad de piezas nuevas a sumar al stock actual de cada producto.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                {products.map((p) => {
                  const addedVal = addStockValues[p.id] ?? "";
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-white hover:border-primary/40 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-text-primary truncate">{p.name}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                          Stock actual:{" "}
                          <span className="font-semibold text-text-secondary">
                            {p.stock} unidades
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">+</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          min="0"
                          disabled={isSavingAddStock}
                          placeholder="0"
                          value={addedVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAddStockValues((prev) => ({ ...prev, [p.id]: val }));
                          }}
                          className="w-24 h-10 px-3 text-right rounded-xl border border-border outline-none transition focus:border-primary focus:ring-1 focus:ring-primary font-bold text-sm bg-gray-50/50 disabled:opacity-60"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-border flex gap-2">
                <button
                  type="button"
                  disabled={isSavingAddStock}
                  onClick={handleCloseAddStockModal}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:bg-gray-100 transition cursor-pointer disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSavingAddStock}
                  onClick={handleSaveAddStock}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#1f523b] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-80"
                >
                  {isSavingAddStock ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4" />
                      <span>Guardar Inventario</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon,
  accent = "neutral",
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent?: "green" | "red" | "amber" | "blue" | "neutral";
  onClick?: () => void;
}) {
  const accents = {
    green: {
      icon: "border-emerald-100 bg-emerald-100/70 text-emerald-700",
    },
    red: {
      icon: "border-rose-100 bg-rose-100/70 text-rose-700",
    },
    amber: {
      icon: "border-amber-100 bg-amber-100/70 text-amber-700",
    },
    blue: {
      icon: "border-sky-100 bg-sky-100/70 text-sky-700",
    },
    neutral: {
      icon: "border-black/[0.04] bg-background text-text-muted",
    },
  }[accent];

  const className = `relative flex min-h-[108px] flex-col justify-between rounded-2xl border border-black/[0.05] bg-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(15,23,42,0.03)] transition-all duration-200 ${
    onClick
      ? "cursor-pointer select-none hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      : ""
  }`;

  const content = (
    <>
      <div className="flex justify-between items-center">
        <p className="text-[12px] font-semibold text-text-muted">{label}</p>
        <span className={`rounded-xl border p-1.5 shadow-2xs ${accents.icon}`}>{icon}</span>
      </div>
      <div className="mt-2">
        <p className="truncate font-display text-2xl font-bold leading-none tabular-nums text-text-primary">
          {value}
        </p>
        <p className="mt-1 truncate text-[12px] font-medium text-text-muted">{sub}</p>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} text-left`}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function ChartPanel({
  title,
  subtitle,
  empty,
  children,
}: {
  title: string;
  subtitle: string;
  empty: boolean;
  children: React.ReactElement;
}) {
  return (
    <div className="flex h-[300px] flex-col rounded-2xl border border-border bg-white p-4">
      <div className="mb-4">
        <h3 className="font-display text-base font-bold text-text-primary">{title}</h3>
        <p className="text-[13px] text-text-muted">{subtitle}</p>
      </div>
      <div className="min-h-0 flex-1 text-xs">
        {empty ? (
          <div className="flex h-full items-center justify-center text-text-muted">
            Sin datos en el periodo
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function FilterDropdown({
  open,
  onOpenChange,
  refEl,
  activeCount,
  summary,
  timeFilter,
  productFilter,
  clientFilter,
  products,
  clients,
  onTimeChange,
  onProductChange,
  onClientChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refEl: React.RefObject<HTMLDivElement | null>;
  activeCount: number;
  summary: string;
  timeFilter: TimeFilter;
  productFilter: string;
  clientFilter: string;
  products: Product[];
  clients: Client[];
  onTimeChange: (value: string) => void;
  onProductChange: (value: string) => void;
  onClientChange: (value: string) => void;
}) {
  const resetFilters = () => {
    onTimeChange("Hoy");
    onProductChange("Todos");
    onClientChange("Todos");
  };

  return (
    <div ref={refEl} className="relative w-full sm:w-auto">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="dashboard-filters-menu"
        className="inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-[14px] font-bold text-text-primary transition hover:bg-muted active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
      >
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <span>Filtros</span>
        {activeCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-none text-white">
            {activeCount}
          </span>
        )}
        <span className="hidden max-w-[150px] truncate text-[12px] font-semibold text-text-muted xl:inline">
          {summary}
        </span>
        <ChevronDown className={`h-4 w-4 text-text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          id="dashboard-filters-menu"
          role="dialog"
          aria-label="Filtros del dashboard"
          className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 max-h-[min(560px,calc(100dvh-8rem))] overflow-y-auto rounded-2xl border border-border bg-white p-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:mt-2 sm:w-[420px] sm:max-h-none sm:overflow-visible"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-text-primary">Filtros</p>
              <p className="mt-0.5 truncate text-[12px] font-medium text-text-muted">{summary}</p>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-text-secondary transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
              disabled={activeCount === 0}
            >
              Limpiar
            </button>
          </div>

          <div className="mt-3 grid gap-3">
            <FilterSelect
              icon={<Calendar className="h-3.5 w-3.5 text-primary" />}
              label="Periodo"
              value={timeFilter}
              onChange={onTimeChange}
              options={[
                ["Hoy", "Hoy"],
                ["Semana", "Esta semana"],
                ["Mes", "Este mes"],
                ["Año", "Este año"],
                ["Todo", "Histórico"],
              ]}
            />
            <FilterSelect
              icon={<Package className="h-3.5 w-3.5 text-primary" />}
              label="Producto"
              value={productFilter}
              onChange={onProductChange}
              options={[
                ["Todos", "Todos los productos"],
                ...products.map((p) => [p.id, p.name] as [string, string]),
              ]}
            />
            <FilterSelect
              icon={<Store className="h-3.5 w-3.5 text-primary" />}
              label="Cliente"
              value={clientFilter}
              onChange={onClientChange}
              options={[
                ["Todos", "Todos los clientes"],
                ...clients.map((c) => [c.id, `${c.name} (${c.channel})`] as [string, string]),
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-text-muted">
        {icon}
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-8 text-[14px] font-semibold text-text-primary outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
        >
          {options.map(([optionValue, optionLabel]) => (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      </span>
    </label>
  );
}

function SaleCardItem({
  sale: s,
  open,
  onToggle,
  onCobrar,
}: {
  sale: Sale;
  open: boolean;
  onToggle: () => void;
  onCobrar: (sale: Sale) => void;
}) {
  const d = new Date(s.createdAt);
  const t = d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition list-none">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left cursor-pointer"
        onClick={onToggle}
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
                if (i.returnQty && i.returnQty > 0)
                  list.push(`[Cambio: ${i.productName} ×${i.returnQty}]`);
                return list.join(" ");
              })
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-0.5 text-[11px] text-text-muted">
            {dateStr} · {t}
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
        <ChevronDown
          className={`h-4 w-4 text-text-muted transition ml-1 ${open ? "rotate-180" : ""}`}
        />
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
                      Cambio (Merma): {i.productName}{" "}
                      <span className="opacity-70">×{i.returnQty}</span>
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
                onClick={() => onCobrar(s)}
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
}

// ─── CSV Sheet ────────────────────────────────────────────────────────────────

type CsvTab = "ventas" | "clientes" | "productos";

function CSVSheet({ onClose }: { onClose: () => void }) {
  const { sales, clients, products, addClient, addProduct } = useArtisan();
  const [tab, setTab] = useState<CsvTab>("ventas");
  const [toast, setToast] = useState<string | null>(null);
  const clientFileRef = useRef<HTMLInputElement>(null);
  const productFileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleImportFile = (
    ref: React.RefObject<HTMLInputElement | null>,
    parser: (text: string) => unknown[],
    adder: (item: unknown) => void,
    label: string,
  ) => {
    const file = ref.current?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parser(text);
      rows.forEach((r) => adder(r));
      if (ref.current) ref.current.value = "";
      showToast(`${rows.length} ${label} importados correctamente`);
    };
    reader.readAsText(file);
  };

  const tabs: { id: CsvTab; label: string }[] = [
    { id: "ventas", label: "Ventas" },
    { id: "clientes", label: "Clientes" },
    { id: "productos", label: "Productos" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-50 rounded-t-3xl bg-surface border border-border shadow-2xl md:max-w-lg">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-bold text-text-primary">Importar / Exportar CSV</h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted text-text-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-full py-1.5 text-[13px] font-semibold border transition ${
                tab === t.id
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-text-secondary border-border hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-5 py-5 space-y-3">
          {tab === "ventas" && (
            <>
              <InfoBox>
                Exporta todas las ventas registradas en formato CSV. El archivo incluye fecha,
                cliente, productos, totales, costos y estado de cobro.
              </InfoBox>
              <ActionRow
                icon={<Download className="h-4 w-4" />}
                label="Exportar ventas"
                sublabel={`${sales.length} registros`}
                onClick={() => exportSalesCSV(sales)}
                variant="primary"
              />
              <InfoBox tone="muted">
                La importación de ventas no está disponible por ahora — los registros de ventas solo
                se crean desde la app para mantener la integridad de los datos.
              </InfoBox>
            </>
          )}

          {tab === "clientes" && (
            <>
              <InfoBox>
                Exporta o importa tu lista de clientes. El CSV debe tener las columnas:{" "}
                <code className="text-primary font-mono text-[11px]">
                  id, nombre, canal, ultima_entrega
                </code>
              </InfoBox>
              <ActionRow
                icon={<Download className="h-4 w-4" />}
                label="Exportar clientes"
                sublabel={`${clients.length} clientes`}
                onClick={() => exportClientsCSV(clients)}
                variant="primary"
              />
              <ActionRow
                icon={<Upload className="h-4 w-4" />}
                label="Importar clientes"
                sublabel="Selecciona un archivo .csv"
                onClick={() => clientFileRef.current?.click()}
                variant="secondary"
              />
              <input
                ref={clientFileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={() =>
                  handleImportFile(
                    clientFileRef,
                    parseClientsCSV as (t: string) => unknown[],
                    (c) => addClient(c as Parameters<typeof addClient>[0]),
                    "clientes",
                  )
                }
              />
            </>
          )}

          {tab === "productos" && (
            <>
              <InfoBox>
                Exporta o importa tu catálogo de productos. El CSV debe tener:{" "}
                <code className="text-primary font-mono text-[11px]">
                  id, nombre, costo, precio_dist, precio_pub, stock
                </code>
              </InfoBox>
              <ActionRow
                icon={<Download className="h-4 w-4" />}
                label="Exportar productos"
                sublabel={`${products.length} productos`}
                onClick={() => exportProductsCSV(products)}
                variant="primary"
              />
              <ActionRow
                icon={<Upload className="h-4 w-4" />}
                label="Importar productos"
                sublabel="Selecciona un archivo .csv"
                onClick={() => productFileRef.current?.click()}
                variant="secondary"
              />
              <input
                ref={productFileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={() =>
                  handleImportFile(
                    productFileRef,
                    parseProductsCSV as (t: string) => unknown[],
                    (p) => addProduct(p as Parameters<typeof addProduct>[0]),
                    "productos",
                  )
                }
              />
            </>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="mx-5 mb-5 rounded-xl bg-primary text-white text-[13px] font-medium px-4 py-3 flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {toast}
          </div>
        )}
      </div>
    </>
  );
}

function InfoBox({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: "green" | "muted";
}) {
  return (
    <div
      className={`rounded-xl px-3.5 py-3 text-[12px] leading-relaxed ${
        tone === "green" ? "bg-primary-light text-primary/80" : "bg-muted text-text-muted"
      }`}
    >
      {children}
    </div>
  );
}

function ActionRow({
  icon,
  label,
  sublabel,
  onClick,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  onClick: () => void;
  variant: "primary" | "secondary";
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3.5 border transition ${
        variant === "primary"
          ? "bg-primary text-white border-primary hover:bg-emerald-700"
          : "bg-background text-text-primary border-border hover:bg-muted"
      }`}
    >
      <span
        className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${
          variant === "primary" ? "bg-white/20" : "bg-primary-light text-primary"
        }`}
      >
        {icon}
      </span>
      <div className="flex-1 text-left">
        <p className="text-[14px] font-semibold">{label}</p>
        <p className={`text-[12px] ${variant === "primary" ? "text-white/70" : "text-text-muted"}`}>
          {sublabel}
        </p>
      </div>
      <Download
        className={`h-4 w-4 shrink-0 ${variant === "primary" ? "text-white/60" : "text-text-muted"}`}
      />
    </button>
  );
}

interface OnboardingModalProps {
  onClose: () => void;
  onRemindLater: () => void;
}

function OnboardingModal({ onClose, onRemindLater }: OnboardingModalProps) {
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "Registra ventas al instante",
      desc: "Presiona el botón '+ Nueva venta' para iniciar. Registra compras, selecciona clientes y documenta cambios (mermas) en segundos.",
      icon: <Receipt className="h-10 w-10 text-emerald-600" />,
    },
    {
      title: "Tu negocio de un vistazo",
      desc: "Monitorea tus ventas totales, ganancias estimadas y productos entregados en el Dashboard. Aplica filtros de tiempo para analizar tu rendimiento.",
      icon: <TrendingUp className="h-10 w-10 text-sky-600" />,
    },
    {
      title: "Controla tu inventario",
      desc: "Mantén al día tus existencias de producto. Cada venta o cambio realizado descuenta de forma automática tu stock físico.",
      icon: <Package className="h-10 w-10 text-violet-600" />,
    },
  ];

  const current = steps[step - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gray-50 mb-4 border border-border/40">
            {current.icon}
          </div>
          <div className="flex gap-1.5 mb-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  n === step ? "w-6 bg-primary" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-[12px] font-semibold text-primary">Paso {step} de 3</p>
          <h3 className="mt-2 font-display text-[18px] font-bold text-text-primary">
            {current.title}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{current.desc}</p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-white transition hover:bg-[#246448]"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-white transition hover:bg-[#246448]"
            >
              Comenzar ahora
            </button>
          )}
          <button
            onClick={onRemindLater}
            className="w-full py-2.5 text-[13px] font-semibold text-text-muted hover:text-text-secondary transition"
          >
            Recordarme más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
