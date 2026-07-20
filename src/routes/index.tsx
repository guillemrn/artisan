import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Menu,
  Store,
  User,
  CheckCircle2,
  Clock,
  ChevronDown,
  Receipt,
  Plus,
  Download,
  Upload,
  X,
  Database,
} from "lucide-react";
import { useArtisan } from "@/lib/artisan-store";
import { USER_NAME, formatMXN, formatMXNc } from "@/lib/artisan-data";
import { Logo } from "@/components/ui/logo";
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

type Filter = "Hoy" | "Semana" | "Mes";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function Home() {
  const { sales, updateSaleStatus } = useArtisan();
  const [filter, setFilter] = useState<Filter>("Hoy");
  const [openId, setOpenId] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  const now = Date.now();
  const filtered = sales.filter((s) => {
    const t = new Date(s.createdAt).getTime();
    if (filter === "Hoy") return t >= startOfDay(new Date());
    if (filter === "Semana") return now - t <= 7 * 86400_000;
    return now - t <= 30 * 86400_000;
  });

  const ventasTotal = filtered.reduce((s, x) => s + x.total, 0);
  const gananciaTotal = filtered.reduce((s, x) => s + x.profit, 0);
  const margen = ventasTotal > 0 ? Math.round((gananciaTotal / ventasTotal) * 100) : 0;
  const paquetes = filtered.reduce((s, x) => s + x.items.reduce((n, i) => n + i.qty, 0), 0);
  const porCobrar = filtered
    .filter((x) => x.status === "Pendiente")
    .reduce((s, x) => s + x.total, 0);
  const nPendientes = filtered.filter((x) => x.status === "Pendiente").length;

  const dateLabel = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const initials = USER_NAME.slice(0, 2).toUpperCase();

  return (
    <div className="page-shell md:px-0 md:pt-8">
      {csvOpen && <CSVSheet onClose={() => setCsvOpen(false)} />}

      <div className="flex items-center justify-between">
        <Logo variant="full" className="h-8 w-auto md:hidden" />
        <div className="hidden md:block" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCsvOpen(true)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-white text-text-secondary transition hover:bg-muted md:h-9 md:w-auto md:px-3"
            aria-label="Importar / Exportar datos"
          >
            <Database className="h-5 w-5" />
            <span className="ml-2 hidden text-[13px] font-semibold md:inline">Datos</span>
          </button>
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

      <section className="mt-6 rounded-2xl border border-border bg-[#1F2B2E] p-5 text-white shadow-[0_18px_44px_rgba(31,43,46,0.16)] md:mt-2 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[13px] font-semibold capitalize text-white/60">{dateLabel}</p>
            <h1 className="mt-2 font-display text-[28px] font-bold leading-tight md:text-[36px]">
              Buenos días, {USER_NAME}
            </h1>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-white/68 md:text-[15px]">
              Revisa ventas, cobros y producción con un resumen operativo claro.
            </p>
          </div>

          <Link
            to="/nueva-venta"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-[14px] font-bold text-[#1F2B2E] transition hover:bg-[#F7F3EC]"
          >
            <Plus className="h-4 w-4" />
            Nueva venta
          </Link>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl border border-border bg-white p-1 md:max-w-sm">
        {(["Hoy", "Semana", "Mes"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg py-2 text-[13px] font-bold transition ${
              filter === f
                ? "bg-primary text-white shadow-sm"
                : "text-text-secondary hover:bg-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          label="VENTAS"
          value={formatMXN(ventasTotal)}
          sub={`${filtered.length} transacciones`}
          tone="grad-green"
        />
        <Kpi
          label="GANANCIA"
          value={formatMXN(gananciaTotal)}
          sub={`${margen}% margen`}
          tone="grad-blue"
        />
        <Kpi label="PAQUETES" value={String(paquetes)} sub="vendidos" tone="grad-purple" />
        <Kpi
          label="POR COBRAR"
          value={formatMXN(porCobrar)}
          sub={`${nPendientes} pendientes`}
          tone="grad-yellow"
        />
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-bold text-text-primary">Ventas</h2>
            <p className="text-[13px] text-text-muted">
              Transacciones filtradas por {filter.toLowerCase()}
            </p>
          </div>
          <Link
            to="/nueva-venta"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-bold text-primary transition hover:bg-primary-light"
          >
            <Plus className="h-4 w-4" />
            Nueva
          </Link>
        </div>

        {filtered.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-3 text-text-muted">
            <Receipt className="h-10 w-10 opacity-30" />
            <p className="text-[14px]">Sin ventas en este periodo</p>
          </div>
        )}

        <ul className="mt-3 grid gap-2 pb-4 lg:grid-cols-2">
          {filtered.map((s) => {
            const open = openId === s.id;
            const t = new Date(s.createdAt).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <li
                key={s.id}
                className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(31,43,46,0.08)]"
              >
                <button
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  onClick={() => setOpenId(open ? null : s.id)}
                >
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      s.channel === "PDV"
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
                      {s.items.map((i) => `${i.productName} ×${i.qty}`).join(" · ")}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">{t}</p>
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
                    className={`h-4 w-4 text-text-muted transition ml-1 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {open && (
                  <div className="border-t border-border px-4 py-3 space-y-2">
                    {/* Items detail */}
                    <div className="space-y-1">
                      {s.items.map((i) => (
                        <div key={i.productId} className="flex justify-between text-[13px]">
                          <span>
                            {i.productName} <span className="text-text-muted">×{i.qty}</span>
                          </span>
                          <span className="font-semibold">{formatMXNc(i.unitPrice * i.qty)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Meta row */}
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

                    {/* Actions */}
                    <div className="pt-2 border-t border-border flex gap-2">
                      {s.status === "Pendiente" && (
                        <button
                          onClick={() =>
                            updateSaleStatus(
                              s.id,
                              "Entregado",
                              s.payment === "Pendiente" ? "Efectivo" : s.payment,
                            )
                          }
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary text-white text-[13px] font-semibold py-2 transition hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Marcar entregado
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
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: string;
}) {
  return (
    <div className={`${tone} rounded-2xl border border-border/80 p-4 shadow-sm`}>
      <p className="text-[11px] font-bold tracking-wide text-text-muted">{label}</p>
      <p className="mt-2 text-[23px] font-bold leading-tight text-text-primary">{value}</p>
      <p className="mt-1 text-[12px] font-medium text-text-secondary">{sub}</p>
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
