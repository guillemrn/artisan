import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Check,
  ChevronLeft,
  Clock3,
  Gift,
  Landmark,
  Loader2,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  Store,
  User,
  UserPlus,
} from "lucide-react";
import { AddClientSheet } from "@/components/artisan/AddClientSheet";
import { formatMXN, formatMXNc, type Client, type PaymentMethod } from "@/lib/artisan-data";
import { buildSaleItems, useArtisan } from "@/lib/artisan-store";
import { useAuth } from "@/core/auth/auth-context";
import { DataLoadError, DataLoadSkeleton } from "@/components/artisan/DataLoadState";
import { calculateSaleFinancials } from "@/lib/artisan-sale-calculations";

export const Route = createFileRoute("/nueva-venta")({
  head: () => ({ meta: [{ title: "Nueva venta — Artisan" }] }),
  component: NuevaVenta,
});

type SaleItem = ReturnType<typeof buildSaleItems>[number];

const flowSteps = [
  { number: 1, label: "Cliente" },
  { number: 2, label: "Productos" },
  { number: 3, label: "Cobro" },
] as const;

const paymentOptions: {
  value: PaymentMethod;
  description: string;
  icon: typeof Banknote;
}[] = [
  { value: "Efectivo", description: "Cobro recibido", icon: Banknote },
  { value: "Transferencia", description: "Cobro recibido", icon: Landmark },
  { value: "Pendiente", description: "Cobrar después", icon: Clock3 },
  { value: "Consignación", description: "Liquidar después", icon: Store },
  { value: "Cortesía", description: "Sin cobro", icon: Gift },
];

function NuevaVenta() {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { draft, setDraft, resetDraft, addSale, products, sales, isLoading, loadError } =
    useArtisan();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = useMemo(
    () => buildSaleItems(draft.quantities, draft.returns || {}, draft.priceMode, products),
    [draft.quantities, draft.returns, draft.priceMode, products],
  );
  const returnsCount = items.reduce((sum, item) => sum + (item.returnQty ?? 0), 0);
  const {
    total: netTotal,
    cost,
    mermaCost,
    profit,
    margin,
  } = calculateSaleFinancials(items, draft.payment);
  const canContinue1 = Boolean(draft.client);
  const canContinue2 = items.length > 0;

  if (loadError) return <DataLoadError message={loadError} />;
  if (isLoading) return <DataLoadSkeleton variant="form" title="Preparando nueva venta" />;

  const goBack = () => {
    if (step === 1) {
      navigate({ to: "/app" });
      return;
    }
    setStep((step - 1) as 1 | 2);
  };

  const goNext = () => {
    if (step === 1 && canContinue1) setStep(2);
    if (step === 2 && canContinue2) setStep(3);
  };

  const confirm = async () => {
    if (!draft.client || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const bizName = user?.user_metadata?.business_name || "Artisan";
      const prefix = bizName
        .slice(0, 3)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "X")
        .padEnd(3, "X");
      const prefixSales = sales.filter((sale) => sale.id.startsWith(`${prefix}-`));
      const maxNum = prefixSales.reduce((current, sale) => {
        const parsed = Number.parseInt(sale.id.split("-").at(-1) || "", 10);
        return Number.isNaN(parsed) ? current : Math.max(current, parsed);
      }, 0);
      let id = `${prefix}-${String(maxNum + 1).padStart(4, "0")}`;
      if (sales.some((sale) => sale.id === id)) id = `${prefix}-${Date.now().toString().slice(-6)}`;

      const createdAt = new Date().toISOString();
      const isPaid = draft.payment !== "Pendiente" && draft.payment !== "Consignación";

      await addSale({
        id,
        clientId: draft.client.id,
        clientName: draft.client.name,
        channel: draft.client.channel,
        items,
        total: netTotal,
        cost,
        profit,
        payment: draft.payment,
        status: isPaid ? "Entregado" : "Pendiente",
        createdAt,
        paidAt: isPaid ? createdAt : undefined,
        priceMode: draft.priceMode,
      });
      await navigate({ to: "/ticket/$saleId", params: { saleId: id } });
      resetDraft();
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      setSubmitError(
        error instanceof Error ? error.message : "Error desconocido al registrar la venta",
      );
    }
  };

  return (
    <div className="page-shell mx-auto max-w-[1240px] md:px-0 md:pt-7">
      <FlowHeader step={step} onBack={goBack} />

      {submitError && (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">No se pudo guardar la venta</p>
            <p className="mt-0.5 text-xs text-destructive/90">{submitError}</p>
          </div>
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <main className="min-w-0">
          {step === 1 && (
            <StepClient
              onPick={(client) => setDraft((current) => ({ ...current, client }))}
              selectedId={draft.client?.id}
            />
          )}
          {step === 2 && (
            <StepProducts
              client={draft.client!}
              priceMode={draft.priceMode}
              setPriceMode={(priceMode) => setDraft((current) => ({ ...current, priceMode }))}
              quantities={draft.quantities}
              setQty={(id, qty) =>
                setDraft((current) => ({
                  ...current,
                  quantities: { ...current.quantities, [id]: Math.max(0, qty) },
                }))
              }
              returns={draft.returns || {}}
              setReturnQty={(id, qty) =>
                setDraft((current) => ({
                  ...current,
                  returns: { ...(current.returns || {}), [id]: Math.max(0, qty) },
                }))
              }
              onChangeClient={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepConfirm
              client={draft.client!}
              items={items}
              payment={draft.payment}
              setPayment={(payment) => setDraft((current) => ({ ...current, payment }))}
            />
          )}
        </main>

        <SaleSummary
          step={step}
          client={draft.client ?? undefined}
          items={items}
          total={netTotal}
          cost={cost}
          mermaCost={mermaCost}
          profit={profit}
          margin={margin}
          returnsCount={returnsCount}
          canContinue={step === 1 ? canContinue1 : canContinue2}
          isSubmitting={isSubmitting}
          onNext={goNext}
          onBack={() => setStep((step - 1) as 1 | 2)}
          onConfirm={confirm}
        />
      </div>

      <MobileActionBar
        step={step}
        total={netTotal}
        returnsCount={returnsCount}
        canContinue={step === 1 ? canContinue1 : canContinue2}
        isSubmitting={isSubmitting}
        onNext={goNext}
        onBack={() => setStep(2)}
        onConfirm={confirm}
      />
      <div className="h-28 xl:h-8" />
    </div>
  );
}

function FlowHeader({ step, onBack }: { step: 1 | 2 | 3; onBack: () => void }) {
  const descriptions = [
    "Elige quién recibe esta venta.",
    "Registra lo que entregas y los cambios.",
    "Revisa el movimiento y define el cobro.",
  ];

  return (
    <header className="border-b border-border pb-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={step === 1 ? "Salir de nueva venta" : "Volver al paso anterior"}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-white text-text-secondary transition hover:border-primary/30 hover:bg-primary-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[24px] font-extrabold text-text-primary md:text-[28px]">
            Nueva venta
          </h1>
          <p className="mt-1 text-sm text-text-secondary">{descriptions[step - 1]}</p>
        </div>
      </div>

      <nav aria-label="Progreso de la venta" className="mt-5 grid grid-cols-3 gap-2">
        {flowSteps.map((item) => {
          const complete = item.number < step;
          const current = item.number === step;
          return (
            <div
              key={item.number}
              aria-current={current ? "step" : undefined}
              className={`flex min-w-0 items-center gap-2 border-t-2 pt-3 transition-colors ${
                item.number <= step ? "border-primary" : "border-border"
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  complete
                    ? "bg-primary text-white"
                    : current
                      ? "bg-primary-light text-primary ring-1 ring-primary/20"
                      : "bg-muted text-text-muted"
                }`}
              >
                {complete ? <Check className="h-4 w-4" /> : item.number}
              </span>
              <span
                className={`truncate text-xs font-bold md:text-sm ${
                  current ? "text-text-primary" : "text-text-muted"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </nav>
    </header>
  );
}

function StepClient({
  onPick,
  selectedId,
}: {
  onPick: (client: Client) => void;
  selectedId?: string;
}) {
  const { clients, addClient } = useArtisan();
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const filtered = clients.filter((client) =>
    client.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <section aria-labelledby="client-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="client-title" className="text-xl font-bold text-text-primary">
            Selecciona un cliente
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            El canal define el precio sugerido para la venta.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-primary/25 bg-white px-4 text-sm font-bold text-primary transition hover:bg-primary-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </div>

      <div className="relative mt-5">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre"
          aria-label="Buscar cliente"
          className="h-12 w-full rounded-md border border-border bg-white pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-border">
        {filtered.length > 0 ? (
          <ul className="grid gap-px md:grid-cols-2">
            {filtered.map((client) => {
              const selected = selectedId === client.id;
              return (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => onPick(client)}
                    className={`group flex min-h-[74px] w-full items-center gap-3 bg-white px-4 py-3 text-left transition focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 ${
                      selected ? "bg-primary-light" : "hover:bg-[#fbfcfb]"
                    }`}
                  >
                    <ChannelIcon channel={client.channel} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-text-primary">
                        {client.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-text-muted">
                        Último movimiento: {client.lastDelivery}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        className={`text-[11px] font-bold ${
                          client.channel === "PDV" ? "text-primary" : "text-[#b85e2f]"
                        }`}
                      >
                        {client.channel}
                      </span>
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full border transition ${
                          selected
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-white text-transparent group-hover:border-primary/40"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="bg-white px-5 py-12 text-center">
            <User className="mx-auto h-7 w-7 text-text-muted" />
            <p className="mt-3 text-sm font-bold text-text-primary">No encontramos ese cliente</p>
            <p className="mt-1 text-xs text-text-muted">
              Puedes registrarlo sin salir de la venta.
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-4 text-sm font-bold text-primary hover:underline"
            >
              Agregar cliente
            </button>
          </div>
        )}
      </div>

      <AddClientSheet
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSave={addClient}
        onCreated={onPick}
        lastDeliveryLabel="Nueva incorporación"
      />
    </section>
  );
}

function ChannelIcon({ channel }: { channel: Client["channel"] }) {
  const isStore = channel === "PDV";
  return (
    <span
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${
        isStore ? "bg-primary-light text-primary" : "bg-[#fff2e9] text-[#c66a39]"
      }`}
    >
      {isStore ? <Store className="h-5 w-5" /> : <User className="h-5 w-5" />}
    </span>
  );
}

function StepProducts({
  client,
  priceMode,
  setPriceMode,
  quantities,
  setQty,
  returns,
  setReturnQty,
  onChangeClient,
}: {
  client: Client;
  priceMode: "distributor" | "public";
  setPriceMode: (mode: "distributor" | "public") => void;
  quantities: Record<string, number>;
  setQty: (id: string, qty: number) => void;
  returns: Record<string, number>;
  setReturnQty: (id: string, qty: number) => void;
  onChangeClient: () => void;
}) {
  const { products } = useArtisan();
  const [query, setQuery] = useState("");
  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <section aria-labelledby="products-title">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="products-title" className="text-xl font-bold text-text-primary">
            Agrega productos
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Para <span className="font-bold text-text-primary">{client.name}</span>
            <button
              type="button"
              onClick={onChangeClient}
              className="ml-2 font-bold text-primary hover:underline"
            >
              Cambiar
            </button>
          </p>
        </div>
        <div className="inline-grid grid-cols-2 rounded-md border border-border bg-white p-1">
          {(["distributor", "public"] as const).map((mode) => (
            <button
              type="button"
              key={mode}
              onClick={() => setPriceMode(mode)}
              className={`min-h-9 rounded-sm px-4 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 ${
                priceMode === mode ? "bg-primary text-white" : "text-text-secondary hover:bg-muted"
              }`}
            >
              {mode === "distributor" ? "Mayoreo" : "Público"}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-5">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar producto"
          aria-label="Buscar producto"
          className="h-12 w-full rounded-md border border-border bg-white pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-white">
        <div className="hidden grid-cols-[minmax(0,1fr)_178px_178px] gap-4 border-b border-border bg-muted/60 px-4 py-2.5 text-[11px] font-bold text-text-muted md:grid">
          <span>Producto</span>
          <span className="text-center">Venta</span>
          <span className="text-center">Cambio</span>
        </div>
        {filtered.length > 0 ? (
          <ul className="divide-y divide-border">
            {filtered.map((product) => {
              const qty = quantities[product.id] ?? 0;
              const returnQty = returns[product.id] ?? 0;
              const selected = qty + returnQty > 0;
              const stockUsed = qty + returnQty;
              const atStockLimit = stockUsed >= product.stock;
              const price =
                priceMode === "distributor" ? product.distributorPrice : product.publicPrice;

              return (
                <li
                  key={product.id}
                  className={`grid gap-4 px-4 py-4 transition md:grid-cols-[minmax(0,1fr)_178px_178px] md:items-center ${
                    selected ? "bg-primary-light/55" : "hover:bg-[#fbfcfb]"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-md ${
                        selected ? "bg-primary text-white" : "bg-muted text-text-secondary"
                      }`}
                    >
                      <Package className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <p className="truncate text-sm font-bold text-text-primary">
                          {product.name}
                        </p>
                        <p className="shrink-0 text-sm font-extrabold text-text-primary">
                          {formatMXN(price)}
                        </p>
                      </div>
                      <p
                        className={`mt-0.5 text-xs ${product.stock === 0 ? "font-bold text-danger" : "text-text-muted"}`}
                      >
                        {product.stock === 0
                          ? "Agotado"
                          : `${product.stock - stockUsed} de ${product.stock} disponibles`}
                      </p>
                    </div>
                  </div>

                  <QuantityControl
                    label="Venta"
                    value={qty}
                    onDecrease={() => setQty(product.id, qty - 1)}
                    onIncrease={() => setQty(product.id, qty + 1)}
                    disableDecrease={qty === 0}
                    disableIncrease={atStockLimit}
                    tone="sale"
                  />
                  <QuantityControl
                    label="Cambio"
                    value={returnQty}
                    onDecrease={() => setReturnQty(product.id, returnQty - 1)}
                    onIncrease={() => setReturnQty(product.id, returnQty + 1)}
                    disableDecrease={returnQty === 0}
                    disableIncrease={atStockLimit}
                    tone="return"
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-5 py-12 text-center">
            <Package className="mx-auto h-7 w-7 text-text-muted" />
            <p className="mt-3 text-sm font-bold text-text-primary">No encontramos ese producto</p>
            <p className="mt-1 text-xs text-text-muted">Prueba con otro nombre.</p>
          </div>
        )}
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-text-muted">
        <RefreshCw className="h-3.5 w-3.5 text-warning" />
        Cambio registra producto reemplazado sin volver a cobrarlo.
      </p>
    </section>
  );
}

function QuantityControl({
  label,
  value,
  onDecrease,
  onIncrease,
  disableDecrease,
  disableIncrease,
  tone,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disableDecrease: boolean;
  disableIncrease: boolean;
  tone: "sale" | "return";
}) {
  const activeColor = tone === "sale" ? "bg-primary text-white" : "bg-warning text-white";
  return (
    <div className="flex items-center justify-between gap-3 md:justify-center">
      <span className="text-xs font-semibold text-text-muted md:hidden">{label}</span>
      <div className="grid grid-cols-[36px_42px_36px] items-center overflow-hidden rounded-md border border-border bg-white">
        <button
          type="button"
          onClick={onDecrease}
          disabled={disableDecrease}
          aria-label={`Restar ${label.toLowerCase()}`}
          className="grid h-9 place-items-center text-text-secondary transition hover:bg-muted disabled:opacity-30"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span
          aria-live="polite"
          className={`grid h-9 place-items-center border-x border-border text-sm font-extrabold ${
            value > 0 ? (tone === "sale" ? "text-primary" : "text-warning") : "text-text-primary"
          }`}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={disableIncrease}
          aria-label={`Sumar ${label.toLowerCase()}`}
          className={`grid h-9 place-items-center transition disabled:bg-muted disabled:text-text-muted ${activeColor}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function StepConfirm({
  client,
  items,
  payment,
  setPayment,
}: {
  client: Client;
  items: SaleItem[];
  payment: PaymentMethod;
  setPayment: (payment: PaymentMethod) => void;
}) {
  return (
    <section aria-labelledby="confirm-title" className="space-y-5">
      <div>
        <h2 id="confirm-title" className="text-xl font-bold text-text-primary">
          Revisa antes de registrar
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Venta para <span className="font-bold text-text-primary">{client.name}</span> ·{" "}
          {client.channel}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-border bg-muted/60 px-4 py-2.5 text-[11px] font-bold text-text-muted sm:grid-cols-[minmax(0,1fr)_150px_110px]">
          <span>Producto</span>
          <span className="hidden text-center sm:block">Movimiento</span>
          <span className="text-right">Importe</span>
        </div>
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li
              key={item.productId}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_150px_110px]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-text-primary">{item.productName}</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  {formatMXNc(item.unitPrice)} por pieza
                </p>
                <div className="mt-1 flex gap-2 text-xs font-bold sm:hidden">
                  {item.qty > 0 && <span className="text-primary">Venta · {item.qty}</span>}
                  {(item.returnQty ?? 0) > 0 && (
                    <span className="text-warning">Cambio · {item.returnQty}</span>
                  )}
                </div>
              </div>
              <div className="hidden justify-center gap-2 text-xs font-bold sm:flex">
                {item.qty > 0 && <span className="text-primary">Venta · {item.qty}</span>}
                {(item.returnQty ?? 0) > 0 && (
                  <span className="text-warning">Cambio · {item.returnQty}</span>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-text-primary">
                  {formatMXN(item.qty * item.unitPrice)}
                </p>
                {(item.returnQty ?? 0) > 0 && (
                  <p className="mt-0.5 text-[11px] font-bold text-warning">Cambio sin cobro</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-base font-bold text-text-primary">¿Cómo queda el cobro?</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Esto define si la venta queda cobrada o pendiente.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {paymentOptions.map(({ value, description, icon: Icon }) => {
            const selected = payment === value;
            return (
              <button
                type="button"
                key={value}
                onClick={() => setPayment(value)}
                className={`flex min-h-[66px] items-center gap-3 rounded-md border px-3.5 py-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 ${
                  selected
                    ? "border-primary bg-primary-light"
                    : "border-border bg-white hover:border-primary/30"
                }`}
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${
                    selected ? "bg-primary text-white" : "bg-muted text-text-secondary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-text-primary">{value}</span>
                  <span className="block text-xs text-text-muted">{description}</span>
                </span>
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full border ${
                    selected ? "border-primary bg-primary text-white" : "border-border"
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SaleSummary({
  step,
  client,
  items,
  total,
  cost,
  mermaCost,
  profit,
  margin,
  returnsCount,
  canContinue,
  isSubmitting,
  onNext,
  onBack,
  onConfirm,
}: {
  step: 1 | 2 | 3;
  client?: Client;
  items: SaleItem[];
  total: number;
  cost: number;
  mermaCost: number;
  profit: number;
  margin: number;
  returnsCount: number;
  canContinue: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const soldCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <aside className="sticky top-24 hidden overflow-hidden rounded-lg border border-border bg-white xl:block">
      <div className="border-b border-border px-5 py-4">
        <p className="text-sm font-bold text-text-primary">Resumen de venta</p>
        <p className="mt-0.5 text-xs text-text-muted">Se guarda hasta que confirmes.</p>
      </div>
      <div className="space-y-4 px-5 py-5">
        <div>
          <p className="text-xs font-semibold text-text-muted">Cliente</p>
          {client ? (
            <div className="mt-2 flex items-center gap-3">
              <ChannelIcon channel={client.channel} />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-text-primary">{client.name}</p>
                <p className="text-xs text-text-muted">{client.channel}</p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-text-muted">Aún no seleccionado</p>
          )}
        </div>

        {step > 1 && (
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Productos</span>
              <span className="font-bold text-text-primary">{soldCount} piezas</span>
            </div>
            {returnsCount > 0 && (
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-text-secondary">Cambios</span>
                <span className="font-bold text-warning">{returnsCount} piezas</span>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2 border-t border-border pt-4 text-sm">
            <SummaryRow label="Costo" value={formatMXN(cost)} />
            {mermaCost > 0 && <SummaryRow label="Costo de cambios" value={formatMXN(mermaCost)} />}
            <SummaryRow label="Ganancia de venta" value={formatMXN(profit)} accent />
            <SummaryRow label="Margen" value={`${margin}%`} />
          </div>
        )}

        {step > 1 && (
          <div className="border-t border-border pt-4">
            <div className="flex items-end justify-between gap-3">
              <span className="text-sm font-bold text-text-primary">Total a cobrar</span>
              <span className="font-display text-2xl font-extrabold text-primary">
                {formatMXN(total)}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-border p-3">
        {step === 3 ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-[#1d5a40] disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isSubmitting ? "Registrando..." : "Registrar y crear ticket"}
            </button>
            <button
              type="button"
              onClick={onBack}
              disabled={isSubmitting}
              className="h-10 w-full rounded-md text-sm font-bold text-text-secondary transition hover:bg-muted disabled:opacity-50"
            >
              Volver a productos
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!canContinue}
            onClick={onNext}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:bg-[#1d5a40] disabled:opacity-35"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-text-muted">{label}</span>
      <span className={`font-bold ${accent ? "text-primary" : "text-text-primary"}`}>{value}</span>
    </div>
  );
}

function MobileActionBar({
  step,
  total,
  returnsCount,
  canContinue,
  isSubmitting,
  onNext,
  onBack,
  onConfirm,
}: {
  step: 1 | 2 | 3;
  total: number;
  returnsCount: number;
  canContinue: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed bottom-20 left-1/2 z-30 w-full max-w-[460px] -translate-x-1/2 px-4 md:bottom-5 xl:hidden">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-white p-3 shadow-[0_12px_36px_rgba(15,23,42,0.14)]">
        {step > 1 && (
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-text-muted">
              {returnsCount > 0 ? `${returnsCount} cambios · Total` : "Total"}
            </p>
            <p className="truncate text-lg font-extrabold text-text-primary">{formatMXN(total)}</p>
          </div>
        )}
        {step === 3 && (
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="h-11 rounded-md px-3 text-sm font-bold text-text-secondary transition hover:bg-muted disabled:opacity-50"
          >
            Anterior
          </button>
        )}
        <button
          type="button"
          disabled={(step < 3 && !canContinue) || isSubmitting}
          onClick={step === 3 ? onConfirm : onNext}
          className={`flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-bold text-white transition hover:bg-[#1d5a40] disabled:opacity-35 ${
            step === 1 ? "w-full" : "shrink-0"
          }`}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : step === 3 ? (
            <Check className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          {isSubmitting ? "Registrando..." : step === 3 ? "Registrar venta" : "Continuar"}
        </button>
      </div>
    </div>
  );
}
