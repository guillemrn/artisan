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
  BarChart3,
  X,
  Download,
  Upload,
  Bell,
  Star,
  Zap,
  Send,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useArtisan } from "@/lib/artisan-store";
import { USER_NAME, formatMXN, formatMXNc, type Sale, type PaymentMethod } from "@/lib/artisan-data";
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

function Home() {
  const { user } = useAuth();


  const { sales, products, clients, updateSaleStatus, updateProduct } = useArtisan();

  // State for filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Hoy");
  const [productFilter, setProductFilter] = useState<string>("Todos");
  const [clientFilter, setClientFilter] = useState<string>("Todos");

  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<"Todos" | "Entregado" | "Pendiente">("Todos");

  const [openId, setOpenId] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);

  // States for Cobrar Confirmation & Pending Sales Modals
  const [saleToCobrar, setSaleToCobrar] = useState<Sale | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("Efectivo");
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
    setSelectedPayment(
      ["Pendiente", "Consignación"].includes(sale.payment) ? "Efectivo" : sale.payment
    );
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
    const remindLaterCount = parseInt(localStorage.getItem("onboarding_remind_later_count") ?? "0", 10);

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
    const remindLaterCount = parseInt(localStorage.getItem("onboarding_remind_later_count") ?? "0", 10);
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
  const greeting = currentHour < 12 ? "Buenos días" : currentHour < 19 ? "Buenas tardes" : "Buenas noches";

  // 1. Filter Sales by Time
  const timeFilteredSales = useMemo(() => {
    const now = Date.now();
    return sales.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      if (timeFilter === "Hoy") return t >= startOfDay(new Date());
      if (timeFilter === "Semana") return t >= startOfWeek(new Date());
      if (timeFilter === "Mes") return t >= startOfMonth(new Date());
      if (timeFilter === "Año") return t >= startOfYear(new Date());
      return true; // "Todo"
    });
  }, [sales, timeFilter]);

  // 2. Filter Sales by Client
  const clientFilteredSales = useMemo(() => {
    if (clientFilter === "Todos") return timeFilteredSales;
    return timeFilteredSales.filter((s) => s.clientId === clientFilter);
  }, [timeFilteredSales, clientFilter]);

  // 3. Filter Sales by Product (Only matching items inside each sale)
  const fullyFilteredSales = useMemo(() => {
    if (productFilter === "Todos") return clientFilteredSales;
    return clientFilteredSales.filter((s) =>
      s.items.some((i) => i.productId === productFilter)
    );
  }, [clientFilteredSales, productFilter]);

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

    fullyFilteredSales.forEach((s) => {
      s.items.forEach((item) => {
        // If product filter is active, only sum metrics for this product
        if (productFilter === "Todos" || item.productId === productFilter) {
          const itemTotal = s.payment === "Cortesía" ? 0 : item.qty * item.unitPrice;
          const itemCost = item.qty * item.cost;

          if (s.status === "Entregado") {
            salesTotal += itemTotal;
            costTotal += itemCost;
          } else {
            pendingSalesTotal += itemTotal;
          }

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
  }, [fullyFilteredSales, productFilter]);

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
            salesAmount += s.payment === "Cortesía" ? 0 : item.qty * item.unitPrice;
            costAmount += item.qty * item.cost;
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

  // Total sales across all products for share percentage
  const totalSalesAllProducts = useMemo(() => {
    return productPerformance.reduce((s, p) => s + p.salesAmount, 0);
  }, [productPerformance]);

  // --- Recharts Chart Data Generation ---

  // 1. Tendencia Diaria Chart
  const trendChartData = useMemo(() => {
    const dailyMap: Record<string, number> = {};

    // Sort chronological order
    const sortedSales = [...fullyFilteredSales].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    sortedSales.forEach((s) => {
      const dateKey = new Date(s.createdAt).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
      });

      // Sum only matching items if product filter active
      let val = 0;
      s.items.forEach((item) => {
        if (productFilter === "Todos" || item.productId === productFilter) {
          val += s.payment === "Cortesía" ? 0 : item.qty * item.unitPrice;
        }
      });

      dailyMap[dateKey] = (dailyMap[dateKey] ?? 0) + val;
    });

    return Object.entries(dailyMap).map(([fecha, total]) => ({
      fecha,
      Ventas: total,
    }));
  }, [fullyFilteredSales, productFilter]);

  // 2. Ventas por Producto Chart
  const productChartData = useMemo(() => {
    const map: Record<string, number> = {};
    fullyFilteredSales.forEach((s) => {
      s.items.forEach((item) => {
        if (productFilter === "Todos" || item.productId === productFilter) {
          map[item.productName] = (map[item.productName] ?? 0) + item.qty;
        }
      });
    });

    return Object.entries(map).map(([name, paquetes]) => ({
      name,
      paquetes,
    }));
  }, [fullyFilteredSales, productFilter]);

  // 3. Ventas por Clientes Chart (Top 5)
  const clientChartData = useMemo(() => {
    const map: Record<string, number> = {};
    fullyFilteredSales.forEach((s) => {
      s.items.forEach((item) => {
        if (productFilter === "Todos" || item.productId === productFilter) {
          map[s.clientName] = (map[s.clientName] ?? 0) + item.qty;
        }
      });
    });

    return Object.entries(map)
      .map(([name, paquetes]) => ({
        name,
        paquetes,
      }))
      .sort((a, b) => b.paquetes - a.paquetes)
      .slice(0, 5);
  }, [fullyFilteredSales, productFilter]);

  return (
    <div className="page-shell md:px-0 md:pt-8 space-y-6">
      {csvOpen && <CSVSheet onClose={() => setCsvOpen(false)} />}

      {/* Hero Welcome Card */}
      <section className="rounded-2xl border border-border bg-[#243437] p-5 text-white shadow-[0_18px_44px_rgba(31,43,46,0.12)] md:p-7 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(46,125,91,0.58),transparent_34%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[13px] font-semibold capitalize text-white/60">{dateLabel}</p>
            <h1 className="mt-2 font-display text-[26px] font-bold leading-tight md:text-[34px]">
              {greeting}, {displayName}
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-white/68 md:text-[15px]">
              Gestiona tu inventario, ventas y clientes con Almara.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsAddStockModalOpen(true)}
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 text-[14px] font-bold text-white transition hover:bg-white/20 active:scale-[0.99] cursor-pointer"
            >
              <Package className="h-4 w-4" />
              Agregar inventario
            </button>
            <Link
              to="/nueva-venta"
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-5 text-[14px] font-bold text-[#243437] shadow-md transition hover:bg-[#F7F3EC] active:scale-[0.99]"
            >
              <Plus className="h-4 w-4" />
              Nueva venta
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Filters Grid */}
      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Time Filter Dropdown */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" /> Rango de Tiempo
          </label>
          <div className="relative">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-border outline-none transition focus:border-primary focus:ring-1 focus:ring-primary text-[14px] font-semibold bg-white appearance-none"
            >
              <option value="Hoy">Hoy</option>
              <option value="Semana">Esta Semana</option>
              <option value="Mes">Este Mes</option>
              <option value="Año">Este Año</option>
              <option value="Todo">Histórico Todo</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted h-4 w-4 pointer-events-none" />
          </div>
        </div>

        {/* Product Filter Dropdown */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-primary" /> Filtrar Producto
          </label>
          <div className="relative">
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-border outline-none transition focus:border-primary focus:ring-1 focus:ring-primary text-[14px] font-semibold bg-white appearance-none"
            >
              <option value="Todos">Todos los productos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted h-4 w-4 pointer-events-none" />
          </div>
        </div>

        {/* Client Filter Dropdown */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1">
            <Store className="h-3.5 w-3.5 text-primary" /> Punto de Venta / Cliente
          </label>
          <div className="relative">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full h-10 px-3 pr-8 rounded-xl border border-border outline-none transition focus:border-primary focus:ring-1 focus:ring-primary text-[14px] font-semibold bg-white appearance-none"
            >
              <option value="Todos">Todos los clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.channel})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted h-4 w-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="space-y-6">
        {/* Resumen Financiero */}
        <div>
          <h4 className="text-[11px] font-bold tracking-wider text-text-muted uppercase mb-2">Resumen Financiero (Efectivo/Transferencia)</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              label="VENTAS COBRADAS"
              value={formatMXN(kpiData.salesTotal)}
              sub={`${fullyFilteredSales.filter(s => s.status === "Entregado").length} cobradas`}
              icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
              tone="bg-gradient-to-br from-emerald-50 to-white"
            />
            <Kpi
              label="COSTOS TOTALES"
              value={formatMXN(kpiData.costTotal)}
              sub="entregados y cortesías"
              icon={<DollarSign className="h-4 w-4 text-rose-600" />}
              tone="bg-gradient-to-br from-rose-50 to-white"
            />
            <Kpi
              label="GANANCIA NETA"
              value={formatMXN(kpiData.profitTotal)}
              sub={`${kpiData.margin}% margen util.`}
              icon={<TrendingUp className="h-4 w-4 text-sky-600" />}
              tone="bg-gradient-to-br from-sky-50 to-white"
            />
            <Kpi
              label="POR COBRAR"
              value={formatMXN(kpiData.pendingSalesTotal)}
              sub={`${fullyFilteredSales.filter(s => s.status === "Pendiente").length} pendientes / consignación`}
              icon={<DollarSign className="h-4 w-4 text-amber-600" />}
              tone="bg-gradient-to-br from-amber-50 to-white"
              onClick={() => setIsPendingSalesModalOpen(true)}
            />
          </div>
        </div>

        {/* Métricas de Operación */}
        <div>
          <h4 className="text-[11px] font-bold tracking-wider text-text-muted uppercase mb-2">Métricas de Operación</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Kpi
              label="TOP PRODUCTO"
              value={kpiData.topProduct}
              sub={kpiData.maxQty > 0 ? `${kpiData.maxQty} paquetes` : "Ninguno"}
              icon={<Package className="h-4 w-4 text-violet-600" />}
              tone="bg-gradient-to-br from-violet-50 to-white"
            />
            <Kpi
              label="PAQUETES ENTREGADOS"
              value={String(kpiData.packagesTotal)}
              sub="en el periodo"
              icon={<CheckCircle2 className="h-4 w-4 text-amber-600" />}
              tone="bg-gradient-to-br from-amber-50 to-white"
            />
            <Kpi
              label="PRODUCTOS CAMBIADOS"
              value={String(kpiData.returnsTotal)}
              sub="cambios / devoluciones"
              icon={<RefreshCw className="h-4 w-4 text-orange-600" />}
              tone="bg-gradient-to-br from-orange-50 to-white"
            />
          </div>
        </div>
      </div>

      {/* Product Economy Table (Excel-like) */}
      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-gray-50 flex items-center justify-between">
          <h3 className="font-display text-[15px] font-bold text-text-primary">Economía del producto</h3>
          <span className="text-[11px] font-bold text-text-muted bg-border px-2 py-0.5 rounded-full uppercase">
            {timeFilter}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-text-muted font-bold text-left">
                <th className="px-4 py-3 min-w-[150px]">Producto</th>
                <th className="px-4 py-3 text-right">Costo</th>
                <th className="px-4 py-3 text-right">Dist.</th>
                <th className="px-4 py-3 text-right">Público</th>
                <th className="px-4 py-3 text-right">Costos Totales</th>
                <th className="px-4 py-3 text-right">Ventas Totales</th>
                <th className="px-4 py-3 text-right">Ganancia</th>
                <th className="px-4 py-3 text-right">% Margen</th>
                <th className="px-4 py-3 text-center">Paquetes</th>
                <th className="px-4 py-3 text-right">% Part. Ventas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {productPerformance.map((prod) => {
                const partVentas =
                  totalSalesAllProducts > 0
                    ? Math.round((prod.salesAmount / totalSalesAllProducts) * 100)
                    : 0;

                return (
                  <tr key={prod.id} className="hover:bg-muted/40 transition">
                    <td className="px-4 py-3 font-semibold text-text-primary">{prod.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMXNc(prod.cost)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMXNc(prod.distributorPrice)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatMXNc(prod.publicPrice)}</td>
                    <td className="px-4 py-3 text-right font-mono text-text-secondary">{formatMXNc(prod.costAmount)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{formatMXNc(prod.salesAmount)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-sky-700">{formatMXNc(prod.profitAmount)}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${prod.margin > 60 ? "bg-green-50 text-green-700" : "bg-gray-50 text-text-secondary"
                        }`}>
                        {prod.margin}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{prod.qtySold}</td>
                    <td className="px-4 py-3 text-right font-semibold text-text-secondary">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="w-8 text-right">{partVentas}%</span>
                        <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${partVentas}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Graphs Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tendencia Diaria Chart Card */}
        <div className="bg-white border border-border rounded-2xl p-4 shadow-sm flex flex-col h-[320px]">
          <div className="mb-4">
            <h4 className="font-display text-[14px] font-bold text-text-primary">Tendencia diaria</h4>
            <p className="text-[12px] text-text-muted">Ventas acumuladas por fecha</p>
          </div>
          <div className="flex-1 w-full text-xs">
            {trendChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted">Sin datos en el periodo</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2e7d5b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2e7d5b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBEBEB" />
                  <XAxis dataKey="fecha" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={40} />
                  <RechartsTooltip formatter={(value) => formatMXN(Number(value))} />
                  <Area
                    type="monotone"
                    dataKey="Ventas"
                    stroke="#2e7d5b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVentas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Ventas por Producto Chart Card */}
        <div className="bg-white border border-border rounded-2xl p-4 shadow-sm flex flex-col h-[320px]">
          <div className="mb-4">
            <h4 className="font-display text-[14px] font-bold text-text-primary">Ventas por producto</h4>
            <p className="text-[12px] text-text-muted">Cantidad de paquetes vendidos</p>
          </div>
          <div className="flex-1 w-full text-xs">
            {productChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted">Sin datos en el periodo</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={productChartData} margin={{ left: 5, right: 10, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EBEBEB" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    tickFormatter={(val) => (val.length > 15 ? val.slice(0, 13) + "..." : val)}
                  />
                  <RechartsTooltip />
                  <Bar dataKey="paquetes" radius={[0, 4, 4, 0]}>
                    {productChartData.map((_entry, index) => {
                      const colors = ["#2e7d5b", "#C9784A", "#1D4ED8", "#7C3AED", "#D97706"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Ventas por Clientes Chart Card */}
        <div className="bg-white border border-border rounded-2xl p-4 shadow-sm flex flex-col h-[320px]">
          <div className="mb-4">
            <h4 className="font-display text-[14px] font-bold text-text-primary">Ventas por cliente</h4>
            <p className="text-[12px] text-text-muted">Top 5 de clientes con más paquetes</p>
          </div>
          <div className="flex-1 w-full text-xs">
            {clientChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-text-muted">Sin datos en el periodo</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={clientChartData} margin={{ left: 5, right: 10, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EBEBEB" />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={110}
                    tickFormatter={(val) => (val.length > 15 ? val.slice(0, 13) + "..." : val)}
                  />
                  <RechartsTooltip />
                  <Bar dataKey="paquetes" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recientes/Historial list */}
      <div className="mt-7 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-[16px] font-bold text-text-primary font-display">Historial de Ventas</h3>
            <p className="text-[12px] text-text-muted">
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
            <div className="hidden md:block overflow-hidden bg-white border border-border rounded-2xl shadow-sm">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-border text-text-muted text-[11px] font-bold uppercase tracking-wider">
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
                    const dateStr = d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit" });
                    const timeStr = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4 text-text-muted">
                          <div>{dateStr}</div>
                          <div className="text-[11px] opacity-75">{timeStr}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-text-primary">{s.clientName}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`rounded-full text-[10px] font-bold px-2 py-0.5 ${s.channel === "PDV"
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
                                    <span className="font-medium text-emerald-800">Entregado:</span> {i.productName}{" "}
                                    <span className="text-text-muted">x{i.qty}</span>
                                  </div>
                                )}
                                {(i.returnQty ?? 0) > 0 && (
                                  <div className="text-warning-dark font-medium">
                                    <span>Cambio:</span> {i.productName} <span className="opacity-80">x{i.returnQty}</span>
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
                        <td className="py-3 px-4 text-right font-bold text-text-primary">{formatMXN(s.total)}</td>
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
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${selectedPayment === method
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
                <p className="text-[10px] font-bold text-text-muted uppercase">Total Por Cobrar</p>
                <p className="text-lg font-bold text-amber-700">{formatMXN(allPendingSalesTotal)}</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-3 pr-1 space-y-3">
            {allPendingSales.length === 0 ? (
              <div className="py-12 text-center text-text-muted">
                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="font-semibold text-sm">¡No hay ventas pendientes por cobrar!</p>
                <p className="text-xs mt-1">Todas las ventas registradas han sido entregadas y cobradas.</p>
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
      <Dialog open={isAddStockModalOpen} onOpenChange={(open) => !open && handleCloseAddStockModal()}>
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
                    Se añadieron con éxito <strong className="font-bold text-text-primary">+{addStockSuccess.totalAdded} unidades</strong> repartidas en <strong className="font-bold text-text-primary">{addStockSuccess.itemsCount} productos</strong>.
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
                          Stock actual: <span className="font-semibold text-text-secondary">{p.stock} unidades</span>
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
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-black/[0.05] bg-white p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_-4px_rgba(15,23,42,0.03)] relative flex flex-col justify-between min-h-[108px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03),0_16px_32px_-6px_rgba(0,0,0,0.06)] ${
        onClick ? "cursor-pointer hover:border-primary/30 group select-none" : ""
      }`}
    >
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-bold tracking-wider text-text-muted/90 uppercase">{label}</p>
        <span className="p-1.5 rounded-xl bg-background border border-black/[0.04] shadow-2xs">{icon}</span>
      </div>
      <div className="mt-2">
        <p className="text-[22px] font-extrabold leading-tight text-text-primary font-display truncate">{value}</p>
        <p className="text-[11px] font-semibold text-text-muted truncate mt-0.5">{sub}</p>
      </div>
    </div>
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
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${s.channel === "PDV"
            ? "bg-primary-light text-primary"
            : "bg-[#F5F3FF] text-[#6D28D9]"
            }`}
        >
          {s.channel === "PDV" ? (
            <Store className="h-5 w-5" />
          ) : (
            <User className="h-5 w-5" />
          )}
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
              className={`flex-1 rounded-full py-1.5 text-[13px] font-semibold border transition ${tab === t.id
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
      className={`rounded-xl px-3.5 py-3 text-[12px] leading-relaxed ${tone === "green" ? "bg-primary-light text-primary/80" : "bg-muted text-text-muted"
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
      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3.5 border transition ${variant === "primary"
        ? "bg-primary text-white border-primary hover:bg-emerald-700"
        : "bg-background text-text-primary border-border hover:bg-muted"
        }`}
    >
      <span
        className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${variant === "primary" ? "bg-white/20" : "bg-primary-light text-primary"
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
                className={`h-1.5 rounded-full transition-all duration-300 ${n === step ? "w-6 bg-primary" : "w-1.5 bg-border"
                  }`}
              />
            ))}
          </div>
          <p className="text-[12px] font-bold text-primary uppercase tracking-wider">Paso {step} de 3</p>
          <h3 className="mt-2 font-display text-[18px] font-bold text-text-primary">{current.title}</h3>
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
