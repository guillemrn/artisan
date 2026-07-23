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
} from "lucide-react";
import { useArtisan } from "@/lib/artisan-store";
import { USER_NAME, formatMXN, formatMXNc } from "@/lib/artisan-data";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/core/auth/auth-context";
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

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Inicio — Artisan" }] }),
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

  if (!user) {
    return <LandingPage />;
  }

  const { sales, products, clients, updateSaleStatus } = useArtisan();

  // State for filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Hoy");
  const [productFilter, setProductFilter] = useState<string>("Todos");
  const [clientFilter, setClientFilter] = useState<string>("Todos");

  const [historySearch, setHistorySearch] = useState("");
  const [historyStatus, setHistoryStatus] = useState<"Todos" | "Entregado" | "Pendiente">("Todos");

  const [openId, setOpenId] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);

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

      {/* Header */}
      <div className="flex items-center justify-between">
        <Logo variant="full" className="h-8 w-auto md:hidden" />
        <div className="hidden md:block" />
        <div className="flex items-center gap-2">
          <Link
            to="/ajustes"
            className="grid h-10 w-10 place-items-center rounded-xl border border-primary/10 bg-primary-light text-sm font-bold text-primary transition hover:opacity-85 md:hidden"
            aria-label="Perfil y Ajustes"
          >
            {initials}
          </Link>
          <Link
            to="/ajustes"
            className="grid h-10 w-10 place-items-center rounded-xl text-text-secondary transition hover:bg-muted md:hidden"
            aria-label="Ajustes"
          >
            <Menu className="h-5 w-5" />
          </Link>
        </div>
      </div>

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
          <Link
            to="/nueva-venta"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[14px] font-bold text-[#243437] shadow-md transition hover:bg-[#F7F3EC] active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            Nueva venta
          </Link>
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
              {historyFilteredSales.slice(0, 15).map((s) => {
                const open = openId === s.id;
                const t = new Date(s.createdAt).toLocaleTimeString("es-MX", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const dateStr = new Date(s.createdAt).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "2-digit",
                });

                return (
                  <li
                    key={s.id}
                    className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition"
                  >
                    <button
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                      onClick={() => setOpenId(open ? null : s.id)}
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
                        <p className="truncate text-[14px] font-bold">{s.clientName}</p>
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
                              onClick={() =>
                                updateSaleStatus(
                                  s.id,
                                  "Entregado",
                                  ["Pendiente", "Consignación"].includes(s.payment) ? "Efectivo" : s.payment,
                                )
                              }
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white text-[13px] font-semibold py-2 transition hover:bg-[#1f523b]"
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
                                onClick={() =>
                                  updateSaleStatus(
                                    s.id,
                                    "Entregado",
                                    ["Pendiente", "Consignación"].includes(s.payment) ? "Efectivo" : s.payment,
                                  )
                                }
                                className="bg-primary hover:bg-[#1f523b] text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition"
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
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <div className={`${tone} rounded-2xl border border-border/80 p-4 shadow-sm relative flex flex-col justify-between h-[104px]`}>
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-bold tracking-wider text-text-muted">{label}</p>
        <span className="p-1 rounded-lg bg-white/70 shadow-sm border border-border/40">{icon}</span>
      </div>
      <div>
        <p className="text-[20px] font-bold leading-tight text-text-primary font-display truncate">{value}</p>
        <p className="text-[11px] font-medium text-text-secondary truncate mt-0.5">{sub}</p>
      </div>
    </div>
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

// ─── Landing Page Component ──────────────────────────────────────────────────

function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "¿Necesito instalar alguna app desde la App Store o Play Store?",
      a: "No. Artisan es una aplicación web de última generación. Funciona directo en el navegador de tu iPhone, Android, computadora o iPad sin ocupar espacio ni requerir descargas.",
    },
    {
      q: "¿Puedo usarlo en varios dispositivos al mismo tiempo?",
      a: "¡Sí! Toda tu información se sincroniza en tiempo real en la nube. Puedes registrar ventas desde tu celular en la calle y tu equipo en el taller verá los datos actualizados al instante.",
    },
    {
      q: "¿Cómo se envían los tickets a los clientes?",
      a: "Al finalizar una venta, Artisan genera un ticket profesional y con un botón esta listo para compartir por WhatsApp en 1 solo clic.",
    },
    {
      q: "¿Requiere tarjeta de crédito para comenzar?",
      a: "No. Puedes crear tu cuenta totalmente gratis hoy mismo y comenzar a organizar tu negocio sin ingresar datos de pago.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#2F3437] selection:bg-[#246448] selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Top Navbar */}
      <header className="bg-[#F5F4EF]/90 backdrop-blur-md sticky top-0 z-50 border-b border-black/5">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Logo variant="full" className="h-8 w-auto text-[#246448]" />

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-[14px] font-semibold text-text-secondary hover:text-text-primary transition"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/login"
              className="inline-flex h-10 items-center justify-center rounded-full bg-[#246448] px-5 text-[14px] font-bold text-white shadow-sm hover:bg-[#1c5039] transition active:scale-[0.98]"
            >
              Registrarse gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section & Desktop/Mobile Showcase */}
      <section className="pt-8 pb-14 px-4 sm:px-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Value Proposition (Cleaned & De-cluttered) */}
          <div className="lg:col-span-5 space-y-6 pt-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F1EC] px-3.5 py-1 text-[12px] font-bold text-[#246448] border border-[#246448]/20">
              <Users className="h-3.5 w-3.5" /> PARA PRODUCTORES Y EMPRENDEDORES
            </div>

            <h1 className="font-display text-[36px] sm:text-[46px] lg:text-[50px] font-extrabold leading-[1.1] tracking-tight text-[#1F2B2E]">
              Gestiona tu negocio artesanal desde <span className="text-[#246448]">un solo lugar.</span>
            </h1>

            <p className="text-[15px] sm:text-[16px] text-text-secondary leading-relaxed">
              Registra ventas en segundos, controla tu inventario y consulta tus ganancias reales con indicadores financieros en tiempo real.
            </p>

            {/* Clean & Simplified Feature Highlights (3 Key Points) */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 border border-black/5">
                <div className="h-9 w-9 rounded-xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0 font-bold">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#1F2B2E]">Ventas y Tickets en Segundos</h4>
                  <p className="text-[12px] text-text-muted">Genera comprobantes de compra y envíalos directo a WhatsApp.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 border border-black/5">
                <div className="h-9 w-9 rounded-xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0 font-bold">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#1F2B2E]">KPIs y Margen Neto al Instante</h4>
                  <p className="text-[12px] text-text-muted">Visualiza tus ventas cobradas, ganancias reales y saldos por cobrar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 border border-black/5">
                <div className="h-9 w-9 rounded-xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0 font-bold">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#1F2B2E]">Inventario Sincronizado</h4>
                  <p className="text-[12px] text-text-muted">Descuento automático de existencias en tu computadora y celular.</p>
                </div>
              </div>
            </div>

            {/* CTA Button & Subtext */}
            <div className="pt-2 flex items-center gap-4 flex-wrap">
              <Link
                to="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#246448] px-7 text-[15px] font-bold text-white shadow-lg shadow-[#246448]/20 hover:bg-[#1c5039] transition active:scale-[0.98]"
              >
                Prueba Artisan gratis <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="text-[13px] text-text-muted italic leading-snug">
                Sin tarjeta.<br />Sin complicaciones.
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Desktop Dashboard + Mobile Overlay Showcase */}
          <div className="lg:col-span-7 relative pt-4 lg:pt-0">

            {/* DESKTOP APP MOCKUP */}
            <div className="bg-[#FAF9F5] rounded-[24px] border border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col md:flex-row text-[#2F3437]">

              {/* Desktop Left Sidebar */}
              <div className="w-full md:w-48 bg-[#F4F3EE] p-4 border-r border-black/5 flex flex-col justify-between shrink-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Logo variant="full" className="h-6 w-auto text-[#246448]" />
                  </div>

                  <button className="w-full h-9 rounded-xl bg-[#246448] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#1c5039] transition">
                    <Plus className="h-4 w-4" /> Nueva venta
                  </button>

                  <nav className="space-y-1 text-[12px] font-semibold">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#E8F4EE] text-[#246448] font-bold">
                      <Store className="h-4 w-4" /> Inicio
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-secondary hover:bg-black/5 transition">
                      <Receipt className="h-4 w-4" /> Ventas
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-secondary hover:bg-black/5 transition">
                      <Package className="h-4 w-4" /> Productos
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-secondary hover:bg-black/5 transition">
                      <Users className="h-4 w-4" /> Clientes
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-secondary hover:bg-black/5 transition">
                      <RefreshCw className="h-4 w-4" /> Ajustes
                    </div>
                  </nav>
                </div>

                <div className="space-y-3 pt-4 border-t border-black/5">

                  <div className="flex items-center gap-2 px-1">
                    <div className="h-7 w-7 rounded-full bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                      AM
                    </div>
                    <div className="truncate">
                      <p className="text-[11px] font-bold text-text-primary truncate">Andrea Moreno</p>
                      <p className="text-[9px] text-text-muted truncate">Emprendedora</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Main Dashboard Body */}
              <div className="flex-1 p-5 bg-[#FAF9F5] space-y-4">

                {/* Search & Header Bar */}
                <div className="flex items-center justify-between gap-4 border-b border-black/5 pb-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="h-3.5 w-3.5 text-text-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      readOnly
                      placeholder="Buscar ventas, clientes o productos"
                      className="w-full h-8 pl-8 pr-3 bg-white rounded-full border border-black/10 text-[11px] placeholder:text-text-muted focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white border border-black/10 flex items-center justify-center text-text-secondary">
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <div className="h-8 px-2.5 rounded-full bg-white border border-black/10 flex items-center justify-center text-[11px] font-bold text-text-primary">
                      AM
                    </div>
                  </div>
                </div>

                {/* Dashboard Greeting */}
                <div>
                  <p className="text-[11px] text-text-muted font-semibold">Miércoles, 22 de Julio</p>
                  <h2 className="text-xl font-bold font-display text-[#1F2B2E]">¡Buenos días, Andrea!</h2>
                  <p className="text-[11px] text-text-muted">Este es el resumen de tu negocio hoy.</p>
                </div>

                {/* 4 Financial KPI Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Card 1 */}
                  <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">VENTAS COBRADAS</span>
                      <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] flex items-center justify-center">
                        $
                      </span>
                    </div>
                    <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-1.5">$4,860.00</p>
                    <p className="text-[9px] text-text-muted mt-0.5">9 cobradas</p>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">COSTOS TOTALES</span>
                      <span className="h-5 w-5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px] flex items-center justify-center">
                        $
                      </span>
                    </div>
                    <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-1.5">$1,920.00</p>
                    <p className="text-[9px] text-text-muted mt-0.5">entregados</p>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">GANANCIA NETA</span>
                      <span className="h-5 w-5 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                        <TrendingUp className="h-3 w-3" />
                      </span>
                    </div>
                    <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-1.5">$2,940.00</p>
                    <p className="text-[9px] text-text-muted mt-0.5">60% margen util.</p>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">POR COBRAR</span>
                      <span className="h-5 w-5 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px] flex items-center justify-center">
                        $
                      </span>
                    </div>
                    <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-1.5">$860.00</p>
                    <p className="text-[9px] text-text-muted mt-0.5">2 pendientes</p>
                  </div>
                </div>

                {/* 3 Operational Metric Cards */}
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">MÉTRICAS DE OPERACIÓN</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-bold text-text-muted uppercase">TOP PRODUCTO</p>
                        <p className="text-[12px] font-bold text-[#1F2B2E] mt-0.5">Jabón Lavanda</p>
                        <p className="text-[9px] text-text-muted mt-0.5">18 unidades vendidas</p>
                      </div>
                      <div className="h-6 w-6 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                        <Package className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
                      <p className="text-[9px] font-bold text-text-muted uppercase">PRODUCTOS ACTIVOS</p>
                      <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-0.5">36</p>
                      <p className="text-[9px] text-text-muted mt-0.5">en tu inventario</p>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
                      <p className="text-[9px] font-bold text-text-muted uppercase">CLIENTES ACTIVOS</p>
                      <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-0.5">22</p>
                      <p className="text-[9px] text-text-muted mt-0.5">este mes</p>
                    </div>
                  </div>
                </div>

                {/* Ventas recientes Table */}
                <div className="bg-white rounded-2xl border border-black/5 p-3.5 shadow-2xs">
                  <h4 className="text-[12px] font-bold text-[#1F2B2E] mb-2.5">Ventas recientes</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="text-text-muted border-b border-black/5 pb-1 font-semibold">
                          <th className="pb-1.5">Cliente</th>
                          <th className="pb-1.5">Producto</th>
                          <th className="pb-1.5">Cantidad</th>
                          <th className="pb-1.5">Total</th>
                          <th className="pb-1.5">Método</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        <tr>
                          <td className="py-2 font-bold text-[#1F2B2E]">Boutique Natural</td>
                          <td className="py-2 text-text-secondary">Jabón Lavanda</td>
                          <td className="py-2 text-text-secondary">6</td>
                          <td className="py-2 font-bold text-[#1F2B2E]">$720.00</td>
                          <td className="py-2">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Transferencia</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-[#1F2B2E]">Tienda Consciente</td>
                          <td className="py-2 text-text-secondary">Shampoo Sólido</td>
                          <td className="py-2 text-text-secondary">4</td>
                          <td className="py-2 font-bold text-[#1F2B2E]">$480.00</td>
                          <td className="py-2">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">Efectivo</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-[#1F2B2E]">Mercado Orgánico</td>
                          <td className="py-2 text-text-secondary">Vela de Soja</td>
                          <td className="py-2 text-text-secondary">5</td>
                          <td className="py-2 font-bold text-[#1F2B2E]">$650.00</td>
                          <td className="py-2">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Transferencia</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-[#1F2B2E]">Cliente Directo</td>
                          <td className="py-2 text-text-secondary">Kit Facial</td>
                          <td className="py-2 text-text-secondary">2</td>
                          <td className="py-2 font-bold text-[#1F2B2E]">$390.00</td>
                          <td className="py-2">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">Efectivo</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

            {/* MOBILE OVERLAY FRAME */}
            <div className="absolute -bottom-10 -right-2 sm:right-2 w-[260px] sm:w-[280px] z-20 shadow-[0_25px_60px_rgba(0,0,0,0.22)] rounded-[38px] border-[7px] border-[#1F2B2E] bg-[#FAF9F5] overflow-hidden hidden sm:block">
              {/* Phone Notch */}
              <div className="bg-[#1F2B2E] h-5 w-full flex items-center justify-center">
                <div className="w-16 h-3 bg-black rounded-full" />
              </div>

              {/* Mobile Content */}
              <div className="p-3.5 space-y-3 bg-[#FAF9F5]">
                {/* Mobile Header */}
                <div className="flex items-center justify-between">
                  <Logo variant="full" className="h-5 w-auto text-[#246448]" />
                  <Bell className="h-3.5 w-3.5 text-text-muted" />
                </div>

                <div>
                  <p className="text-[9px] text-text-muted font-semibold">Miércoles, 22 de Julio</p>
                  <h3 className="text-sm font-bold font-display text-[#1F2B2E]">¡Buenos días, Andrea!</h3>
                </div>

                {/* Mobile KPI 1 */}
                <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-bold text-text-muted uppercase">VENTAS HOY</p>
                    <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-0.5">$4,860.00</p>
                    <p className="text-[8px] text-text-muted">9 cobradas</p>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] flex items-center justify-center">
                    $
                  </div>
                </div>

                {/* Mobile KPI 2 */}
                <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-bold text-text-muted uppercase">GANANCIA</p>
                    <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-0.5">$2,940.00</p>
                    <p className="text-[8px] text-text-muted">60% margen util.</p>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                </div>

                {/* Mobile KPI 3 */}
                <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-bold text-text-muted uppercase">TOP PRODUCTO</p>
                    <p className="text-[11px] font-bold text-[#1F2B2E] mt-0.5">Jabón Lavanda</p>
                    <p className="text-[8px] text-text-muted">18 unidades vendidas</p>
                  </div>
                  <div className="h-6 w-6 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                    <Package className="h-3 w-3" />
                  </div>
                </div>

                {/* Mobile Action Button */}
                <button className="w-full py-2 rounded-xl bg-[#246448] text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm">
                  <Plus className="h-3.5 w-3.5" /> Nueva venta
                </button>

                {/* Mobile Tab Bar */}
                <div className="bg-white rounded-xl border border-black/5 py-1.5 px-3 flex justify-between items-center text-[8px] font-bold text-text-muted">
                  <div className="flex flex-col items-center text-[#246448]">
                    <Store className="h-3.5 w-3.5" />
                    <span>Inicio</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Receipt className="h-3.5 w-3.5" />
                    <span>Ventas</span>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-[#246448] text-white flex items-center justify-center shadow-2xs">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col items-center">
                    <Package className="h-3.5 w-3.5" />
                    <span>Productos</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Ajustes</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM CATEGORIES BAR */}
        <div className="mt-16 bg-white rounded-3xl border border-black/5 p-6 shadow-xs text-center space-y-4">
          <p className="text-[13px] font-semibold text-text-muted">
            Creado para emprendedores que crean productos con sus manos y corazón.
          </p>

          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-[12px] font-bold text-[#1F2B2E]">
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5">
              <span>🥖</span> Alimentos artesanales
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5">
              <span>🌶️</span> Chiles
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5">
              <span>🍓</span> Mermeladas
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5">
              <span>🕯️</span> Velas
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5">
              <span>🧼</span> Shampoos sólidos
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5">
              <span>🌿</span> Artesanías y accesorios
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5 text-[#246448]">
              <span>➕</span> Y más
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION 1: Workflow / How It Works */}
      <section className="py-20 bg-white border-t border-black/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#246448] bg-[#E8F1EC] px-3.5 py-1 rounded-full border border-[#246448]/20">
              FLUJO ULTRA SIMPLE
            </span>
            <h2 className="font-display text-[30px] sm:text-[40px] font-extrabold text-[#1F2B2E]">
              Todo tu negocio organizado en 3 pasos
            </h2>
            <p className="text-[15px] text-text-muted">
              Sin configuraciones complejas. Comienza a registrar ventas desde el primer minuto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-[#FAF9F5] p-8 rounded-3xl border border-black/5 space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-[#246448] text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                1
              </div>
              <h3 className="text-lg font-bold font-display text-[#1F2B2E]">Carga tu Productos</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Ingresa tus precios de venta y costos de producción para calcular tu margen exacto automáticamente.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FAF9F5] p-8 rounded-3xl border border-black/5 space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-[#246448] text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="text-lg font-bold font-display text-[#1F2B2E]">Registra Ventas en Ruta</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Selecciona al cliente, añade los artículos y genera tickets listos para enviar por WhatsApp en 1 clic.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FAF9F5] p-8 rounded-3xl border border-black/5 space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-[#246448] text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="text-lg font-bold font-display text-[#1F2B2E]">Monitorea tus Ganancias</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Revisa tus ventas totales, ganancias netas y saldos por cobrar sin necesidad de hojas de cálculo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION 2: Complete Feature Grid */}
      <section className="py-20 bg-[#F5F4EF] border-t border-black/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#246448] bg-[#E8F1EC] px-3.5 py-1 rounded-full border border-[#246448]/20">
              HERRAMIENTAS ESPECIALIZADAS
            </span>
            <h2 className="font-display text-[30px] sm:text-[40px] font-extrabold text-[#1F2B2E]">
              Diseñado para la velocidad de tu día a día
            </h2>
            <p className="text-[15px] text-text-muted">
              Cada función está optimizada para ahorrarte tiempo en la cocina, taller o camino de reparto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-3 hover:border-[#246448]/30 transition">
              <div className="h-10 w-10 rounded-2xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1F2B2E] font-display">Registro en 3 Clics</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Interfaz táctil optimizada para registrar entregas en segundos con una sola mano desde tu celular.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-3 hover:border-[#246448]/30 transition">
              <div className="h-10 w-10 rounded-2xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0">
                <Send className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1F2B2E] font-display">Tickets de WhatsApp</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Envía comprobantes de compra limpios con el resumen de productos y total directo al cliente.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-3 hover:border-[#246448]/30 transition">
              <div className="h-10 w-10 rounded-2xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1F2B2E] font-display">Control de Saldos Fiados</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Mantén la cuenta clara de créditos y deudas de clientes pendientes para cobrar puntualmente.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-3 hover:border-[#246448]/30 transition">
              <div className="h-10 w-10 rounded-2xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1F2B2E] font-display">Margen Neto Automatizado</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Calcula automáticamente tus ingresos descontando tus costos para saber exactamente cuánto ganaste.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-3 hover:border-[#246448]/30 transition">
              <div className="h-10 w-10 rounded-2xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1F2B2E] font-display">Laptop & Celular Sincronizados</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Usa tu computadora en el taller y tu teléfono en la calle. Tus datos siempre sincronizados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION 3: Social Proof / Testimonials */}
      <section className="py-20 bg-white border-t border-black/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#246448] bg-[#E8F1EC] px-3.5 py-1 rounded-full border border-[#246448]/20">
              HISTORIAS DE ÉXITO
            </span>
            <h2 className="font-display text-[30px] sm:text-[40px] font-extrabold text-[#1F2B2E]">
              Amado por productores independientes
            </h2>
            <p className="text-[15px] text-text-muted">
              Descubre cómo Artisan ayudó a ordenar las cuentas de pequeños emprendedores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FAF9F5] p-6 rounded-3xl border border-black/5 space-y-4">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed italic">
                "Antes tenia que tomar notas por whatsapp y cargarlos al final del dia en mi excel, ahora lo hago en tiempo real."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-9 w-9 rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center">
                  GQ
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#1F2B2E]">Gabriela Q.</h4>
                  <p className="text-[11px] text-text-muted">Almara Cocina</p>
                </div>
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* NEW SECTION 4: FAQ Accordion */}
      <section className="py-20 bg-[#F5F4EF] border-t border-black/5">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#246448] bg-[#E8F1EC] px-3.5 py-1 rounded-full border border-[#246448]/20">
              DUDA DUDOSA
            </span>
            <h2 className="font-display text-[30px] sm:text-[36px] font-extrabold text-[#1F2B2E]">
              Preguntas Frecuentes
            </h2>
            <p className="text-[14px] text-text-muted">
              Todo lo que necesitas saber antes de empezar a usar Artisan.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-black/5 shadow-2xs overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left font-bold text-[15px] text-[#1F2B2E] flex justify-between items-center gap-4 hover:bg-[#FAF9F5] transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-text-muted transition-transform duration-200 shrink-0 ${openFaq === idx ? "rotate-180 text-[#246448]" : ""
                      }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-[13px] text-text-secondary leading-relaxed border-t border-black/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW SECTION 5: Final CTA Banner & Footer */}
      <section className="py-20 bg-[#246448] text-white text-center px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h2 className="font-display text-[32px] sm:text-[44px] font-extrabold leading-tight">
            Comienza a digitalizar tu negocio artesanal hoy mismo
          </h2>
          <p className="text-[16px] text-white/80 max-w-lg mx-auto leading-relaxed">
            Únete a los emprendedores que ya ahorran horas a la semana y tienen el control absoluto de sus ventas y ganancias.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-white px-8 text-[15px] font-bold text-[#246448] shadow-xl hover:bg-slate-100 transition active:scale-[0.98]"
            >
              Crear mi cuenta gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comprehensive Footer */}
      <footer className="py-12 bg-[#EFECE6] border-t border-black/5 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <Logo variant="full" className="h-7 w-auto text-[#246448] mx-auto md:mx-0" />
            <p className="text-[12px] text-text-muted">
              © {new Date().getFullYear()} Artisan. La plataforma completa para productores y emprendedores artesanales.
            </p>
          </div>

          <div className="flex items-center gap-6 text-[13px] font-semibold text-text-secondary">
            <Link to="/login" className="hover:text-[#246448] transition">Iniciar Sesión</Link>
            <Link to="/login" className="hover:text-[#246448] transition">Registrarse</Link>
            <a
              href="https://instagram.com/guillermomrnl"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-[#246448] hover:underline"
            >
              <Instagram className="h-4 w-4" /> @guillermomrnl
            </a>
          </div>
        </div>
      </footer>
    </div>
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

