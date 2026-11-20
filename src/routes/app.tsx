import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, useMemo, useEffect } from "react";
import {
  ArrowRightIcon,
  CalendarBlankIcon,
  CaretDownIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  ClockIcon,
  DatabaseIcon,
  DownloadSimpleIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  PackageIcon,
  PlusIcon,
  ReceiptIcon,
  SlidersHorizontalIcon,
  StorefrontIcon,
  TrendUpIcon,
  UploadSimpleIcon,
  UserIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useArtisan } from "@/lib/artisan-store";
import {
  USER_NAME,
  formatMXN,
  formatMXNc,
  tracksStock,
  isWalkInClient,
  getSaleDashboardDate,
  getSalePaymentDate,
  type Sale,
  type PaymentMethod,
  type Product,
  type Client,
} from "@/lib/artisan-data";
import { useAuth } from "@/core/auth/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ModalSuccessState } from "@/components/ui/ModalSuccessState";
import { Metric } from "@/components/ui/metric";
import { ResultBar } from "@/components/dashboard/ResultBar";
import { ReturnsByClient, type ClientReturns } from "@/components/dashboard/ReturnsByClient";
import { WeekCollected } from "@/components/dashboard/WeekCollected";
import { FirstRun } from "@/components/dashboard/FirstRun";
import { SalesTable } from "@/components/sales/SalesTable";
import { PeriodPicker, type PeriodKey } from "@/components/dashboard/PeriodPicker";
import { formatRange, isInRange, type DateRange } from "@/lib/date-range";
import { toast } from "sonner";
import {
  ResponsiveContainer,
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
  getSaleItemMermaCost,
  getSaleItemRevenue,
} from "@/lib/artisan-sale-calculations";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Panel — Grofit" }] }),
  component: Home,
});

type TimeFilter = PeriodKey;

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

function isDateInPeriod(
  date: string | undefined,
  timeFilter: TimeFilter,
  range: DateRange | null = null,
): boolean {
  if (!date) return false;
  const timestamp = new Date(date).getTime();
  if (timeFilter === "Rango") return range ? isInRange(timestamp, range) : true;
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

  // Solo los productos que llevan inventario aparecen en "Agregar inventario".
  const stockProducts = useMemo(() => products.filter(tracksStock), [products]);

  // State for filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("Hoy");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
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
      for (const p of stockProducts) {
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
  // Móvil: "Mié 18 nov"
  const shortDateLabel = (() => {
    const now = new Date();
    const wd = now.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", "");
    const mo = now.toLocaleDateString("es-MX", { month: "short" }).replace(".", "");
    return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${now.getDate()} ${mo}`;
  })();

  const displayName = user?.user_metadata?.full_name ?? USER_NAME;
  const firstName = String(displayName).split(" ")[0];

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Buenos días" : currentHour < 19 ? "Buenas tardes" : "Buenas noches";

  const selectedProductLabel = products.find((product) => product.id === productFilter)?.name;
  const selectedClientLabel = clients.find((client) => client.id === clientFilter)?.name;
  // El periodo vive en su propio selector; "Filtros" queda para producto y cliente.
  const activeFilterCount = [productFilter !== "Todos", clientFilter !== "Todos"].filter(
    Boolean,
  ).length;
  const filterSummary =
    [
      productFilter !== "Todos" ? selectedProductLabel : null,
      clientFilter !== "Todos" ? selectedClientLabel : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Todos";

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
    return sales.filter((sale) => isDateInPeriod(sale.createdAt, timeFilter, dateRange));
  }, [sales, timeFilter, dateRange]);

  const paymentTimeFilteredSales = useMemo(() => {
    return sales.filter((sale) => isDateInPeriod(getSalePaymentDate(sale), timeFilter, dateRange));
  }, [sales, timeFilter, dateRange]);

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

  // 4. History follows the collection date while preserving delivery reporting above.
  const historyFilteredSales = useMemo(() => {
    return sales
      .filter((sale) => isDateInPeriod(getSaleDashboardDate(sale), timeFilter, dateRange))
      .filter((sale) => clientFilter === "Todos" || sale.clientId === clientFilter)
      .filter(
        (sale) =>
          productFilter === "Todos" || sale.items.some((item) => item.productId === productFilter),
      )
      .filter((sale) => {
        const search = historySearch.toLowerCase();
        const matchesSearch =
          sale.clientName.toLowerCase().includes(search) || sale.id.toLowerCase().includes(search);
        const matchesStatus = historyStatus === "Todos" || sale.status === historyStatus;
        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) =>
          new Date(getSaleDashboardDate(b)).getTime() - new Date(getSaleDashboardDate(a)).getTime(),
      );
  }, [sales, timeFilter, dateRange, clientFilter, productFilter, historySearch, historyStatus]);

  // --- KPIs Calculations ---
  const kpiData = useMemo(() => {
    let salesTotal = 0;
    let costTotal = 0;
    let mermaCostTotal = 0;
    let pendingSalesTotal = 0;
    let packagesTotal = 0;
    let returnsTotal = 0;
    const productQuantities: Record<string, number> = {};

    fullyFilteredPaidSales.forEach((s) => {
      s.items.forEach((item) => {
        if (productFilter === "Todos" || item.productId === productFilter) {
          const itemTotal = getSaleItemRevenue(item, s.payment);
          const itemCost = getSaleItemCost(item);
          const itemMermaCost = getSaleItemMermaCost(item);

          salesTotal += itemTotal;
          costTotal += itemCost;
          mermaCostTotal += itemMermaCost;
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
      mermaCostTotal,
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
      if (isWalkInClient(sale.clientId)) return; // mostrador no compite en rankings
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

  // Widget: cobrado esta semana (lunes a domingo), contra los mismos días de la semana pasada.
  const weekCollected = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const dayMs = 24 * 60 * 60 * 1000;
    const todayIdx = Math.floor((startOfDay(now) - weekStart) / dayMs);
    const labels = ["L", "M", "X", "J", "V", "S", "D"];
    const amounts = new Array(7).fill(0) as number[];
    let lastWeekSameDays = 0;
    const lastWeekStart = weekStart - 7 * dayMs;
    const lastWeekCutoff = lastWeekStart + (todayIdx + 1) * dayMs;

    sales.forEach((sale) => {
      const paidAt = getSalePaymentDate(sale);
      if (!paidAt) return;
      const t = new Date(paidAt).getTime();
      const revenue = sale.items.reduce(
        (sum, item) => sum + getSaleItemRevenue(item, sale.payment),
        0,
      );
      if (t >= weekStart && t < weekStart + 7 * dayMs) {
        amounts[Math.floor((t - weekStart) / dayMs)] += revenue;
      } else if (t >= lastWeekStart && t < lastWeekCutoff) {
        lastWeekSameDays += revenue;
      }
    });

    return {
      days: labels.map((label, i) => ({
        label,
        amount: amounts[i],
        isToday: i === todayIdx,
        isFuture: i > todayIdx,
      })),
      total: amounts.reduce((a, b) => a + b, 0),
      lastWeekSameDays,
      todayLabel: now.toLocaleDateString("es-MX", { weekday: "long" }),
    };
  }, [sales]);

  // Widget: merma por cliente en dinero (respeta periodo, cliente y producto).
  const returnsByClient = useMemo(() => {
    const map: Record<string, ClientReturns> = {};
    fullyFilteredSales.forEach((sale) => {
      if (isWalkInClient(sale.clientId)) return;
      sale.items.forEach((item) => {
        if (productFilter !== "Todos" && item.productId !== productFilter) return;
        const row = (map[sale.clientId] ??= {
          id: sale.clientId,
          name: sale.clientName,
          returnedUnits: 0,
          mermaCost: 0,
          soldAmount: 0,
        });
        row.returnedUnits += item.returnQty ?? 0;
        row.mermaCost += getSaleItemMermaCost(item);
        row.soldAmount += getSaleItemRevenue(item, sale.payment);
      });
    });
    return Object.values(map)
      .filter((row) => row.mermaCost > 0)
      .sort((a, b) => b.mermaCost / (b.soldAmount || 1) - a.mermaCost / (a.soldAmount || 1))
      .slice(0, 4);
  }, [fullyFilteredSales, productFilter]);

  const periodTitle = {
    Hoy: "Tu negocio, hoy",
    Semana: "Tu negocio, esta semana",
    Mes: "Tu negocio, este mes",
    Año: "Tu negocio, este año",
    Todo: "Tu negocio, en total",
    Rango: dateRange ? `Tu negocio, ${formatRange(dateRange)}` : "Tu negocio",
  }[timeFilter];

  const productsMissingCost = productPerformance.filter(
    (product) => product.qtySold > 0 && !(product.cost > 0),
  ).length;

  if (loadError) {
    return <DataLoadError message={loadError} />;
  }

  if (isLoading) {
    return <DataLoadSkeleton variant="dashboard" />;
  }

  // Primer uso: sin ventas todavía, guía hacia la primera venta en lugar de mostrar todo en $0.
  if (sales.length === 0) {
    return (
      <FirstRun firstName={firstName} dateLabel={dateLabel} />
    );
  }

  return (
    <div className="page-shell space-y-5 md:px-0 md:pt-6">
      {csvOpen && <CSVSheet onClose={() => setCsvOpen(false)} />}

      {/* Dashboard Header */}
      <section className="space-y-4">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            <span className="sm:hidden">
              {shortDateLabel} · Hola, {firstName}
            </span>
            <span className="hidden sm:inline">
              {dateLabel} · {greeting}, {displayName}
            </span>
          </p>
          <h1 className="mt-1.5 font-display text-[30px] font-black leading-none tracking-[-0.02em] text-text-primary md:text-[40px]">
            {periodTitle}
          </h1>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <PeriodPicker
            value={timeFilter}
            range={dateRange}
            onChange={(value, range) => {
              setTimeFilter(value);
              if (range) setDateRange(range);
            }}
          />
          <div
            className={`grid gap-2 sm:flex sm:items-center ${stockProducts.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}
          >
            <FilterDropdown
              open={filtersOpen}
              onOpenChange={setFiltersOpen}
              refEl={filtersRef}
              activeCount={activeFilterCount}
              summary={filterSummary}
              productFilter={productFilter}
              clientFilter={clientFilter}
              products={products}
              clients={clients}
              onProductChange={setProductFilter}
              onClientChange={setClientFilter}
            />
            {stockProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAddStockModalOpen(true)}
                className="inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 text-[14px] font-semibold text-text-primary transition hover:border-text-primary hover:bg-surface-2 sm:w-auto sm:px-4"
              >
                <PackageIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">Agregar inventario</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Resultado: ganancia bruta y cómo se forma */}
      <section
        aria-label="Resultado del periodo"
        className="flex flex-col border-t-2 border-text-primary lg:flex-row"
      >
        <div className="flex flex-col gap-2.5 py-5 lg:flex-[5] lg:py-6 lg:pr-10">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-primary">
            Ganancia bruta
          </p>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-display text-[56px] font-black leading-[0.95] tracking-[-0.03em] tabular-nums text-text-primary md:text-[72px]">
              {formatMXN(kpiData.profitTotal)}
            </span>
            {kpiData.salesTotal > 0 && (
              <span className="rounded-sm bg-cta px-2 py-0.5 font-display text-[18px] font-bold tabular-nums text-cta-foreground md:text-[22px]">
                {kpiData.margin}%
              </span>
            )}
          </div>
          <p className="max-w-[400px] text-[14px] leading-relaxed text-text-muted md:text-[15px]">
            Ingresos cobrados menos el costo de lo vendido.{" "}
            <strong className="font-semibold text-text-primary">
              No incluye gastos del negocio
            </strong>{" "}
            como renta, gasolina o sueldos.
          </p>
          {productsMissingCost > 0 && (
            <Link
              to="/productos"
              className="mt-1 flex max-w-[420px] items-start gap-2.5 rounded-md bg-info-bg px-3.5 py-3 text-[13px] leading-snug text-info"
            >
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong className="font-bold">
                  {productsMissingCost === 1
                    ? "1 producto vendido no tiene costo."
                    : `${productsMissingCost} productos vendidos no tienen costo.`}
                </strong>{" "}
                Agrégalo para que tu ganancia sea real →
              </span>
            </Link>
          )}
        </div>

        <div className="border-t border-border py-5 lg:flex-[7] lg:border-l lg:border-t-0 lg:py-6 lg:pl-10">
          <ResultBar
            collected={kpiData.salesTotal}
            cost={kpiData.costTotal}
            merma={kpiData.mermaCostTotal}
            salesCount={fullyFilteredPaidSales.length}
          />
        </div>
      </section>

      {/* Indicadores */}
      <section
        aria-label="Indicadores"
        className="grid grid-cols-2 border-y border-border lg:grid-cols-4"
      >
        <Metric
          label="Por cobrar"
          value={formatMXN(allPendingSalesTotal)}
          sub={
            allPendingSales.length === 0
              ? "Todo cobrado"
              : `${allPendingSales.length} ${allPendingSales.length === 1 ? "nota abierta" : "notas abiertas"} · Ver`
          }
          tone={allPendingSales.length === 0 ? "success" : "warning"}
          onClick={allPendingSales.length > 0 ? () => setIsPendingSalesModalOpen(true) : undefined}
        />
        <Metric
          label="Ventas cobradas"
          value={String(fullyFilteredPaidSales.length)}
          sub={
            kpiData.returnsTotal > 0 ? `${kpiData.returnsTotal} piezas cambiadas` : "en el periodo"
          }
        />
        <Metric
          label="Ticket promedio"
          value={
            fullyFilteredPaidSales.length > 0
              ? formatMXNc(kpiData.salesTotal / fullyFilteredPaidSales.length)
              : "—"
          }
          sub="por venta cobrada"
        />
        <Metric
          label="Entregado"
          value={`${kpiData.packagesTotal}`}
          unit={kpiData.packagesTotal === 1 ? "unidad" : "unidades"}
          sub={kpiData.maxQty > 0 ? `Más vendido: ${kpiData.topProduct}` : "Sin entregas"}
        />
      </section>

      {/*
        Orden por dispositivo: en el celular se actúa (ventas recientes con Cobrar antes que
        las gráficas); en escritorio se analiza (gráficas antes y la tabla al final).
      */}
      <div className="flex flex-col gap-10">
        {/* Widgets */}
        <section aria-label="Widgets" className="order-1 grid gap-x-10 gap-y-8 pt-2 lg:grid-cols-2">
          <WeekCollected
            days={weekCollected.days}
            total={weekCollected.total}
            lastWeekSameDays={weekCollected.lastWeekSameDays}
            todayLabel={weekCollected.todayLabel}
          />
          <ReturnsByClient rows={returnsByClient} />
        </section>

        {/* Recientes/Historial list */}
        <div className="order-2 space-y-3 lg:order-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-[17px] font-bold text-text-primary">
                Ventas recientes
              </h2>
              <p className="text-[13px] text-text-muted">Las últimas 5 con los filtros actuales</p>
            </div>
            {/* Filters for Sales History */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:flex-initial min-w-[155px]">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Buscar cliente…"
                  className="h-10 w-full rounded-md border border-border bg-surface pl-8 pr-2.5 text-[14px] outline-none focus:border-text-primary"
                />
              </div>
              <select
                value={historyStatus}
                onChange={(e) => setHistoryStatus(e.target.value as any)}
                className="h-10 rounded-md border border-border bg-surface px-2 text-[14px] font-semibold outline-none focus:border-text-primary"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Entregado">Cobradas</option>
                <option value="Pendiente">Pendientes de cobro</option>
              </select>
            </div>
          </div>

          <>
            <SalesTable
              sales={historyFilteredSales.slice(0, 5)}
              onCobrar={handleOpenCobrarModal}
              caption="Ventas recientes"
            />
            {historyFilteredSales.length > 5 && (
              <Link
                to="/ventas"
                className="mt-1 inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent-text hover:underline"
              >
                Ver todas las ventas ({historyFilteredSales.length})
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            )}
          </>
        </div>

        <section
          aria-label="Más detalle"
          className="order-3 grid gap-x-8 gap-y-6 md:grid-cols-2 lg:order-2"
        >
          <ChartPanel
            title="Unidades por producto"
            subtitle="El más vendido, en naranja"
            empty={productChartData.length === 0}
          >
            <BarChart
              layout="vertical"
              data={productChartData}
              margin={{ left: 4, right: 8, top: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke="#EDEFF2" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={CHART_TICK}
                allowDecimals={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={108}
                tick={CHART_TICK}
                tickFormatter={(value) => (value.length > 16 ? `${value.slice(0, 14)}…` : value)}
              />
              <RechartsTooltip
                cursor={{ fill: "#F5F6F8" }}
                contentStyle={CHART_TOOLTIP}
                formatter={(value, name) =>
                  name === "venta" ? formatMXNc(Number(value)) : `${value} unidades`
                }
              />
              <Bar dataKey="paquetes" radius={[0, 2, 2, 0]} maxBarSize={22}>
                {productChartData.map((_entry, index) => (
                  <Cell key={`product-cell-${index}`} fill={index === 0 ? "#FF4F00" : "#111111"} />
                ))}
              </Bar>
            </BarChart>
          </ChartPanel>

          <ChartPanel
            title="Clientes con más movimiento"
            subtitle="Unidades entregadas · top 5"
            empty={clientChartData.length === 0}
          >
            <BarChart
              layout="vertical"
              data={clientChartData}
              margin={{ left: 4, right: 8, top: 0, bottom: 0 }}
            >
              <CartesianGrid horizontal={false} stroke="#EDEFF2" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={CHART_TICK}
                allowDecimals={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={108}
                tick={CHART_TICK}
                tickFormatter={(value) => (value.length > 16 ? `${value.slice(0, 14)}…` : value)}
              />
              <RechartsTooltip
                cursor={{ fill: "#F5F6F8" }}
                contentStyle={CHART_TOOLTIP}
                formatter={(value, name) =>
                  name === "venta" ? formatMXNc(Number(value)) : `${value} unidades`
                }
              />
              <Bar dataKey="paquetes" fill="#111111" radius={[0, 2, 2, 0]} maxBarSize={22} />
            </BarChart>
          </ChartPanel>
        </section>
      </div>

      {showOnboarding && (
        <OnboardingModal
          onClose={handleCloseOnboarding}
          onRemindLater={handleRemindLaterOnboarding}
        />
      )}

      {/* Modal 1: Confirmation Modal for Cobrar */}
      <Dialog open={!!saleToCobrar} onOpenChange={(open) => !open && handleCloseCobrarModal()}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-text-primary flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-success" />
              Confirmar Cobro de Venta
            </DialogTitle>
            <DialogDescription className="text-xs text-text-muted mt-1">
              Selecciona el método de pago para registrar el cobro de esta venta.
            </DialogDescription>
          </DialogHeader>

          {saleToCobrar && (
            <div className="space-y-4 py-2">
              <div className="bg-surface-2 p-4 rounded-xl border border-border/80 space-y-2 text-xs">
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
                  <span className="text-base font-bold text-success">
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
                          : "border-border bg-white text-text-secondary hover:bg-surface-2"
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
                  className="rounded-xl border border-danger/30 bg-danger-bg px-3 py-2.5 text-xs font-medium text-danger"
                >
                  {cobroError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={isCobrando}
                  onClick={handleCloseCobrarModal}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:bg-surface-2 transition cursor-pointer disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isCobrando}
                  onClick={handleConfirmCobro}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/85 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-80"
                >
                  {isCobrando ? (
                    <>
                      <CircleNotchIcon className="h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
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
                  <ClockIcon className="h-5 w-5 text-warning" />
                  Ventas Por Cobrar (Todas)
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted mt-0.5">
                  Ventas pendientes de cobro sin importar el filtro de fecha.
                </DialogDescription>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-semibold text-text-muted">Total por cobrar</p>
                <p className="text-lg font-bold tabular-nums text-warning">
                  {formatMXN(allPendingSalesTotal)}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-3 pr-1 space-y-3">
            {allPendingSales.length === 0 ? (
              <div className="py-12 text-center text-text-muted">
                <CheckCircleIcon className="h-10 w-10 mx-auto text-success mb-2 opacity-80" />
                <p className="font-semibold text-sm">¡No hay ventas pendientes por cobrar!</p>
                <p className="text-xs mt-1">
                  Todas las ventas registradas han sido entregadas y cobradas.
                </p>
              </div>
            ) : (
              <SalesTable
                sales={allPendingSales}
                onCobrar={handleOpenCobrarModal}
                caption="Ventas por cobrar"
                layout="list"
              />
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
                  <PackageIcon className="h-5 w-5 text-primary" />
                  ¿Cuántas piezas deseas agregar a tu inventario?
                </DialogTitle>
                <DialogDescription className="text-xs text-text-muted mt-1">
                  Ingresa la cantidad de piezas nuevas a sumar al stock actual de cada producto.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                {stockProducts.map((p) => {
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
                          className="w-24 h-10 px-3 text-right rounded-xl border border-border outline-none transition focus:border-primary focus:ring-1 focus:ring-primary font-bold text-sm bg-surface-2 disabled:opacity-60"
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
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-text-secondary hover:bg-surface-2 transition cursor-pointer disabled:opacity-60"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSavingAddStock}
                  onClick={handleSaveAddStock}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/85 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-80"
                >
                  {isSavingAddStock ? (
                    <>
                      <CircleNotchIcon className="h-4 w-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <PackageIcon className="h-4 w-4" />
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

const CHART_TICK = { fill: "#646B76", fontSize: 11, fontFamily: "Satoshi, sans-serif" };
const CHART_TOOLTIP = {
  border: "1px solid #111111",
  borderRadius: 6,
  boxShadow: "none",
  fontFamily: "Satoshi, sans-serif",
  fontSize: 12,
};

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
    <div className="flex h-[240px] flex-col border-t border-text-primary pt-3 md:h-[300px]">
      <div className="mb-4">
        <h2 className="font-display text-[17px] font-bold text-text-primary">{title}</h2>
        <p className="text-[13px] text-text-muted">{subtitle}</p>
      </div>
      <div className="min-h-0 flex-1 text-xs">
        {empty ? (
          <div className="flex h-full items-center justify-center rounded-lg bg-surface-2 text-[13px] text-text-muted">
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
  productFilter,
  clientFilter,
  products,
  clients,
  onProductChange,
  onClientChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refEl: React.RefObject<HTMLDivElement | null>;
  activeCount: number;
  summary: string;
  productFilter: string;
  clientFilter: string;
  products: Product[];
  clients: Client[];
  onProductChange: (value: string) => void;
  onClientChange: (value: string) => void;
}) {
  const resetFilters = () => {
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
        className="inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 text-[14px] font-semibold text-text-primary transition hover:border-text-primary active:scale-[0.98] sm:w-auto"
      >
        <SlidersHorizontalIcon className="h-4 w-4" />
        <span>Filtros</span>
        {activeCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-sm bg-cta px-1.5 text-[11px] font-bold leading-none text-cta-foreground">
            {activeCount}
          </span>
        )}
        <span className="hidden max-w-[150px] truncate text-[12px] font-semibold text-text-muted xl:inline">
          {summary}
        </span>
        <CaretDownIcon
          className={`h-4 w-4 text-text-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          id="dashboard-filters-menu"
          role="dialog"
          aria-label="Filtros del dashboard"
          className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 max-h-[min(560px,calc(100dvh-8rem))] overflow-y-auto rounded-lg border border-text-primary bg-surface p-4 shadow-[0_12px_32px_-8px_rgba(17,17,17,0.25)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:mt-2 sm:w-[360px] sm:max-h-none sm:overflow-visible"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                Filtrar por
              </p>
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
              icon={<PackageIcon className="h-3.5 w-3.5 text-primary" />}
              label="Producto"
              value={productFilter}
              onChange={onProductChange}
              options={[
                ["Todos", "Todos los productos"],
                ...products.map((p) => [p.id, p.name] as [string, string]),
              ]}
            />
            <FilterSelect
              icon={<StorefrontIcon className="h-3.5 w-3.5 text-primary" />}
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
        <CaretDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      </span>
    </label>
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
            <DatabaseIcon className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-bold text-text-primary">Importar / Exportar CSV</h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-muted text-text-muted"
          >
            <XIcon className="h-4 w-4" />
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
                icon={<DownloadSimpleIcon className="h-4 w-4" />}
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
                icon={<DownloadSimpleIcon className="h-4 w-4" />}
                label="Exportar clientes"
                sublabel={`${clients.length} clientes`}
                onClick={() => exportClientsCSV(clients)}
                variant="primary"
              />
              <ActionRow
                icon={<UploadSimpleIcon className="h-4 w-4" />}
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
                icon={<DownloadSimpleIcon className="h-4 w-4" />}
                label="Exportar productos"
                sublabel={`${products.length} productos`}
                onClick={() => exportProductsCSV(products)}
                variant="primary"
              />
              <ActionRow
                icon={<UploadSimpleIcon className="h-4 w-4" />}
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
            <CheckCircleIcon className="h-4 w-4 shrink-0" />
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
          ? "bg-primary text-white border-primary hover:bg-primary/85"
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
      <DownloadSimpleIcon
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
      icon: <ReceiptIcon className="h-10 w-10 text-text-primary" />,
    },
    {
      title: "Tu negocio de un vistazo",
      desc: "Monitorea tus ventas totales, ganancias estimadas y productos entregados en el Dashboard. Aplica filtros de tiempo para analizar tu rendimiento.",
      icon: <TrendUpIcon className="h-10 w-10 text-text-primary" />,
    },
    {
      title: "Controla tu inventario",
      desc: "Mantén al día tus existencias de producto. Cada venta o cambio realizado descuenta de forma automática tu stock físico.",
      icon: <PackageIcon className="h-10 w-10 text-text-primary" />,
    },
  ];

  const current = steps[step - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-3xl border border-border p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 mb-4 border border-border/40">
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
              className="w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-white transition hover:bg-primary/85"
            >
              Siguiente
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-primary py-3 text-[14px] font-bold text-white transition hover:bg-primary/85"
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
