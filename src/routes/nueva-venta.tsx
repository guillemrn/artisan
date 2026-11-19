import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  ArrowsClockwiseIcon,
  BankIcon,
  CaretLeftIcon,
  ClockIcon,
  GiftIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  MoneyIcon,
  PlusIcon,
  ShoppingBagIcon,
  SpinnerGapIcon,
  StorefrontIcon,
  UserIcon,
  UserPlusIcon,
  WarningCircleIcon,
  type Icon,
} from "@phosphor-icons/react";
import { AddClientSheet } from "@/components/artisan/AddClientSheet";
import {
  DEFERRED_PAYMENTS,
  WALK_IN_CLIENT,
  formatMXN,
  formatMXNc,
  isWalkInClient,
  tracksStock,
  type Client,
  type PaymentMethod,
  type PriceMode,
} from "@/lib/artisan-data";
import { buildSaleItems, useArtisan } from "@/lib/artisan-store";
import { useAuth } from "@/core/auth/auth-context";
import { DataLoadError, DataLoadSkeleton } from "@/components/artisan/DataLoadState";
import { calculateSaleFinancials } from "@/lib/artisan-sale-calculations";
import { buttonClass } from "@/components/ui/button-styles";
import { useMediaQuery } from "@/lib/use-media-query";

export const Route = createFileRoute("/nueva-venta")({
  head: () => ({ meta: [{ title: "Nueva venta — Artisan" }] }),
  component: NuevaVenta,
});

type SaleItem = ReturnType<typeof buildSaleItems>[number];
type Step = 1 | 2 | 3;

const STEPS = [
  { number: 1, label: "Cliente" },
  { number: 2, label: "Productos" },
  { number: 3, label: "Cobro" },
] as const;

const PAYMENT_OPTIONS: { value: PaymentMethod; title: string; hint: string; icon: Icon }[] = [
  { value: "Efectivo", title: "Efectivo", hint: "Ya me pagó", icon: MoneyIcon },
  { value: "Transferencia", title: "Transferencia", hint: "Ya me pagó", icon: BankIcon },
  { value: "Pendiente", title: "Por cobrar", hint: "Me paga después", icon: ClockIcon },
  { value: "Consignación", title: "Consignación", hint: "Se queda en la tienda", icon: StorefrontIcon },
];

function priceModeFor(client: Client): PriceMode {
  return client.channel === "PDV" ? "distributor" : "public";
}

function NuevaVenta() {
  const { user } = useAuth();
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const [stepState, setStep] = useState<Step>(1);
  const { draft, setDraft, resetDraft, addSale, products, sales, isLoading, loadError } =
    useArtisan();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si alguien llega con un borrador sin cliente, siempre empieza por el cliente.
  const step: Step = !draft.client ? 1 : isDesktop && stepState === 3 ? 2 : stepState;

  const items = useMemo(
    () => buildSaleItems(draft.quantities, draft.returns || {}, draft.priceMode, products),
    [draft.quantities, draft.returns, draft.priceMode, products],
  );
  const soldCount = items.reduce((sum, item) => sum + item.qty, 0);
  const returnsCount = items.reduce((sum, item) => sum + (item.returnQty ?? 0), 0);
  const { total, cost, profit } = calculateSaleFinancials(items, draft.payment);
  const hasItems = items.length > 0;
  const walkIn = isWalkInClient(draft.client?.id);

  const pickClient = (client: Client) => {
    setDraft((current) => ({
      ...current,
      client,
      priceMode: priceModeFor(client),
      payment:
        isWalkInClient(client.id) && DEFERRED_PAYMENTS.includes(current.payment)
          ? "Efectivo"
          : current.payment,
    }));
    setStep(2); // tocar un cliente avanza solo
  };

  const confirm = async () => {
    if (!draft.client || !hasItems || isSubmitting) return;
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
      const isPaid = !DEFERRED_PAYMENTS.includes(draft.payment);

      await addSale({
        id,
        clientId: draft.client.id,
        clientName: draft.client.name,
        channel: draft.client.channel,
        items,
        total,
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

  // Escritorio: ⌘/Ctrl + Enter guarda. Esc sale si no hay nada capturado.
  useEffect(() => {
    if (!isDesktop) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        void confirm();
      }
      if (event.key === "Escape" && !hasItems && !draft.client) navigate({ to: "/app" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (loadError) return <DataLoadError message={loadError} />;
  if (isLoading) return <DataLoadSkeleton variant="form" title="Preparando nueva venta" />;

  const goBack = () => {
    if (step === 1) navigate({ to: "/app" });
    else setStep((step - 1) as Step);
  };

  const setPayment = (payment: PaymentMethod) =>
    setDraft((current) => ({ ...current, payment }));

  return (
    <div className="page-shell mx-auto max-w-[1240px] md:px-0 md:pt-6">
      <FlowHeader
        step={step}
        isDesktop={isDesktop}
        onBack={goBack}
        onJump={(target) => {
          if (target < step) setStep(target);
        }}
      />

      {submitError && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-md border border-danger/25 bg-danger-bg p-4 text-danger"
        >
          <WarningCircleIcon weight="bold" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-bold">No se pudo guardar la venta</p>
            <p className="mt-0.5 text-[13px]">{submitError}</p>
          </div>
        </div>
      )}

      <div className="mt-5 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main key={step} className="min-w-0 animate-in fade-in slide-in-from-right-2 duration-200">
          {step === 1 && <StepClient onPick={pickClient} selectedId={draft.client?.id} />}
          {step === 2 && draft.client && (
            <StepProducts
              client={draft.client}
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
          {step === 3 && draft.client && (
            <section aria-labelledby="cobro-title" className="space-y-6">
              <h2 id="cobro-title" className="sr-only">
                Cobro
              </h2>
              <SaleNote client={draft.client} items={items} total={total} profit={profit} />
              <PaymentPicker payment={draft.payment} setPayment={setPayment} walkIn={walkIn} />
            </section>
          )}
        </main>

        {isDesktop && (
          <aside className="sticky top-24 border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="text-[15px] font-bold">Nota de venta</p>
              {draft.client && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="truncate text-[13px] font-semibold text-text-secondary underline-offset-4 hover:text-text-primary hover:underline"
                >
                  {draft.client.name}
                </button>
              )}
            </div>
            {draft.client && hasItems ? (
              <div className="space-y-5 px-5 py-5">
                <SaleNote client={draft.client} items={items} total={total} profit={profit} compact />
                <PaymentPicker
                  payment={draft.payment}
                  setPayment={setPayment}
                  walkIn={walkIn}
                  compact
                />
              </div>
            ) : (
              <p className="px-5 py-8 text-[14px] text-text-muted">
                {draft.client
                  ? "Agrega productos y aquí verás el total y cuánto te deja."
                  : "Elige a quién le vendes para empezar."}
              </p>
            )}
            <div className="border-t border-border p-4">
              <button
                type="button"
                onClick={confirm}
                disabled={!draft.client || !hasItems || isSubmitting}
                className={buttonClass({ variant: "cta", size: "lg", block: true })}
              >
                {isSubmitting && <SpinnerGapIcon weight="bold" className="h-5 w-5 animate-spin" />}
                {isSubmitting ? "Guardando..." : `Guardar venta · ${formatMXN(total)}`}
              </button>
              <p className="mt-2 text-center text-[12px] text-text-muted">⌘ + Enter para guardar</p>
            </div>
          </aside>
        )}
      </div>

      {!isDesktop && step > 1 && (
        <MobileActionBar
          step={step}
          total={total}
          soldCount={soldCount}
          returnsCount={returnsCount}
          canContinue={hasItems}
          isSubmitting={isSubmitting}
          onNext={() => setStep(3)}
          onConfirm={confirm}
        />
      )}
      <div className="h-32 xl:h-8" />
    </div>
  );
}

function FlowHeader({
  step,
  isDesktop,
  onBack,
  onJump,
}: {
  step: Step;
  isDesktop: boolean;
  onBack: () => void;
  onJump: (step: Step) => void;
}) {
  const visibleSteps = isDesktop ? STEPS.slice(0, 2) : STEPS;
  return (
    <header>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label={step === 1 ? "Salir de nueva venta" : "Volver al paso anterior"}
          className="-ml-2 grid h-11 w-11 shrink-0 place-items-center rounded-md text-text-primary transition hover:bg-surface-2"
        >
          <CaretLeftIcon weight="bold" className="h-5 w-5" />
        </button>
        <h1 className="text-[22px] font-black tracking-[-0.02em] md:text-[28px]">Nueva venta</h1>
        {isDesktop && (
          <span className="ml-auto text-[13px] text-text-muted">Esc para salir</span>
        )}
      </div>
      <nav aria-label="Pasos de la venta" className="mt-3 flex gap-1.5">
        {visibleSteps.map((item) => {
          const done = item.number < step;
          const current = item.number === step;
          return (
            <button
              type="button"
              key={item.number}
              onClick={() => onJump(item.number)}
              disabled={!done}
              aria-current={current ? "step" : undefined}
              className="group flex-1 text-left disabled:cursor-default"
            >
              <span
                className={`block h-1 transition-colors duration-300 ${
                  item.number <= step ? "bg-primary" : "bg-border"
                }`}
              />
              <span
                className={`mt-1.5 block text-[12px] font-semibold ${
                  current ? "text-text-primary" : done ? "text-text-secondary group-hover:underline" : "text-text-muted"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}

/* ───────────── Paso 1 · ¿A quién le vendes? ───────────── */

function StepClient({ onPick, selectedId }: { onPick: (client: Client) => void; selectedId?: string }) {
  const { clients, addClient, sales } = useArtisan();
  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const q = query.trim().toLowerCase();
  const filtered = clients.filter((client) => client.name.toLowerCase().includes(q));
  const showWalkIn = !q || WALK_IN_CLIENT.name.toLowerCase().includes(q) || "mostrador".includes(q);

  // Recientes: los últimos clientes a los que les vendiste (sin mostrador).
  const recent = useMemo(() => {
    const seen = new Set<string>();
    const result: Client[] = [];
    for (const sale of sales) {
      if (seen.has(sale.clientId) || isWalkInClient(sale.clientId)) continue;
      seen.add(sale.clientId);
      const client = clients.find((c) => c.id === sale.clientId);
      if (client) result.push(client);
      if (result.length === 3) break;
    }
    return result;
  }, [sales, clients]);

  return (
    <section aria-labelledby="client-title">
      <h2 id="client-title" className="text-[20px] font-black tracking-[-0.01em]">
        ¿A quién le vendes?
      </h2>

      <div className="mt-4 flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Buscar cliente</span>
          <MagnifyingGlassIcon
            weight="bold"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente"
            className="h-12 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-[16px] outline-none transition focus:border-text-primary focus:ring-3 focus:ring-cta/25"
          />
        </label>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className={buttonClass({ variant: "secondary", size: "md", className: "h-12" })}
        >
          <UserPlusIcon weight="bold" className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo cliente</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {!q && recent.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Recientes
          </p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {recent.map((client) => (
              <button
                type="button"
                key={client.id}
                onClick={() => onPick(client)}
                className="h-10 shrink-0 rounded-md border border-border bg-surface px-3.5 text-[14px] font-semibold transition hover:border-text-primary active:scale-[0.97]"
              >
                {client.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="mt-5 divide-y divide-border-soft border-y border-border">
        {showWalkIn && (
          <ClientRow
            client={WALK_IN_CLIENT}
            selected={selectedId === WALK_IN_CLIENT.id}
            onPick={onPick}
            icon={ShoppingBagIcon}
            subtitle="Venta de mostrador · se paga al momento"
          />
        )}
        {filtered.map((client) => (
          <ClientRow
            key={client.id}
            client={client}
            selected={selectedId === client.id}
            onPick={onPick}
            icon={client.channel === "PDV" ? StorefrontIcon : UserIcon}
            subtitle={
              client.channel === "PDV" ? "Punto de venta · Precio mayoreo" : "Público · Precio público"
            }
            meta={client.lastDelivery}
          />
        ))}
      </ul>

      {filtered.length === 0 && q && (
        <div className="py-10 text-center">
          <p className="text-[15px] font-bold">No encontramos “{query.trim()}”</p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className={buttonClass({ variant: "primary", size: "md", className: "mt-4" })}
          >
            <UserPlusIcon weight="bold" className="h-4 w-4" />
            Agregarlo como cliente
          </button>
        </div>
      )}

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

function ClientRow({
  client,
  selected,
  onPick,
  icon: RowIcon,
  subtitle,
  meta,
}: {
  client: Client;
  selected: boolean;
  onPick: (client: Client) => void;
  icon: Icon;
  subtitle: string;
  meta?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(client)}
        className={`flex min-h-[64px] w-full items-center gap-3 px-1 py-3 text-left transition active:bg-surface-2 ${
          selected ? "bg-surface-2" : "hover:bg-surface-2"
        }`}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-surface-2 text-text-primary">
          <RowIcon weight="bold" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold">{client.name}</span>
          <span className="block truncate text-[13px] text-text-muted">{subtitle}</span>
        </span>
        {meta && <span className="shrink-0 text-[12px] text-text-muted">{meta}</span>}
      </button>
    </li>
  );
}

/* ───────────── Paso 2 · ¿Qué le llevas? ───────────── */

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
  priceMode: PriceMode;
  setPriceMode: (mode: PriceMode) => void;
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="products-title" className="text-[20px] font-black tracking-[-0.01em]">
            ¿Qué le llevas?
          </h2>
        </div>
        <div
          role="radiogroup"
          aria-label="Precio"
          className="inline-grid shrink-0 grid-cols-2 rounded-md border border-border p-0.5"
        >
          {(["public", "distributor"] as const).map((mode) => (
            <button
              type="button"
              role="radio"
              aria-checked={priceMode === mode}
              key={mode}
              onClick={() => setPriceMode(mode)}
              className={`h-9 rounded-sm px-3 text-[13px] font-semibold transition ${
                priceMode === mode ? "bg-primary text-primary-foreground" : "text-text-secondary hover:bg-surface-2"
              }`}
            >
              {mode === "distributor" ? "Mayoreo" : "Público"}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onChangeClient}
        className="mt-1 max-w-full truncate text-left text-[14px] text-text-secondary underline-offset-4 hover:underline"
      >
        Para <span className="font-bold text-text-primary">{client.name}</span> · Cambiar
      </button>

      <label className="relative mt-4 block">
        <span className="sr-only">Buscar producto</span>
        <MagnifyingGlassIcon
          weight="bold"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar producto"
          className="h-12 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-[16px] outline-none transition focus:border-text-primary focus:ring-3 focus:ring-cta/25"
        />
      </label>

      {filtered.length > 0 ? (
        <ul className="mt-4 divide-y divide-border-soft border-y border-border xl:grid xl:grid-cols-2 xl:gap-x-8 xl:divide-y-0 xl:border-0">
          {filtered.map((product) => {
            const qty = quantities[product.id] ?? 0;
            const returnQty = returns[product.id] ?? 0;
            const selected = qty + returnQty > 0;
            const limited = tracksStock(product);
            const left = product.stock - qty - returnQty;
            const atStockLimit = limited && left <= 0;
            const price = priceMode === "distributor" ? product.distributorPrice : product.publicPrice;

            return (
              <li
                key={product.id}
                className="py-3.5 xl:border-b xl:border-border-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold">{product.name}</p>
                    <p className="text-[13px] text-text-muted tabular-nums">
                      {formatMXN(price)}
                      {limited &&
                        (product.stock === 0 ? (
                          <span className="font-semibold text-danger"> · Agotado</span>
                        ) : (
                          ` · quedan ${Math.max(0, left)}`
                        ))}
                    </p>
                  </div>
                  {qty > 0 && (
                    <span className="hidden text-[15px] font-bold tabular-nums sm:block">
                      {formatMXN(qty * price)}
                    </span>
                  )}
                  {selected ? (
                    <Stepper
                      label={product.name}
                      value={qty}
                      onDecrease={() => setQty(product.id, qty - 1)}
                      onIncrease={() => setQty(product.id, qty + 1)}
                      disableIncrease={atStockLimit}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setQty(product.id, 1)}
                      disabled={atStockLimit}
                      className={buttonClass({ variant: "secondary", size: "sm", className: "h-10 w-[116px]" })}
                    >
                      <PlusIcon weight="bold" className="h-4 w-4" />
                      Agregar
                    </button>
                  )}
                </div>

                {selected &&
                  (returnQty > 0 ? (
                    <div className="mt-2.5 flex items-center gap-3 rounded-md bg-warning-bg px-3 py-2">
                      <ArrowsClockwiseIcon weight="bold" className="h-4 w-4 shrink-0 text-warning" />
                      <p className="min-w-0 flex-1 text-[13px] text-warning">
                        <span className="font-bold">Cambio ×{returnQty}</span>
                        <span> · sin cobro</span>
                      </p>
                      <Stepper
                        small
                        label={`cambio de ${product.name}`}
                        value={returnQty}
                        onDecrease={() => setReturnQty(product.id, returnQty - 1)}
                        onIncrease={() => setReturnQty(product.id, returnQty + 1)}
                        disableIncrease={atStockLimit}
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReturnQty(product.id, 1)}
                      disabled={atStockLimit}
                      className="mt-1 inline-flex h-8 items-center gap-1.5 text-[13px] font-semibold text-text-secondary hover:text-text-primary disabled:opacity-40"
                    >
                      <ArrowsClockwiseIcon weight="bold" className="h-3.5 w-3.5" />
                      Registrar cambio
                    </button>
                  ))}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-10 text-center text-[14px] text-text-muted">
          No encontramos ese producto. Prueba con otro nombre.
        </p>
      )}
    </section>
  );
}

function Stepper({
  label,
  value,
  onDecrease,
  onIncrease,
  disableIncrease,
  small,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  disableIncrease?: boolean;
  small?: boolean;
}) {
  const size = small ? "h-8 w-8" : "h-10 w-10";
  return (
    <div className="flex shrink-0 items-center rounded-md border border-border bg-surface">
      <button
        type="button"
        onClick={onDecrease}
        aria-label={`Quitar uno de ${label}`}
        className={`grid ${size} place-items-center rounded-l-md transition hover:bg-surface-2 active:scale-[0.94]`}
      >
        <MinusIcon weight="bold" className="h-4 w-4" />
      </button>
      <span
        key={value}
        aria-live="polite"
        className={`grid ${small ? "w-7" : "w-9"} place-items-center text-[15px] font-black tabular-nums animate-in zoom-in-75 duration-150`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disableIncrease}
        aria-label={`Agregar uno de ${label}`}
        className={`grid ${size} place-items-center rounded-r-md bg-primary text-primary-foreground transition active:scale-[0.94] disabled:bg-surface-2 disabled:text-text-muted`}
      >
        <PlusIcon weight="bold" className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ───────────── Paso 3 · ¿Cómo te pagaron? ───────────── */

function SaleNote({
  client,
  items,
  total,
  profit,
  compact,
}: {
  client: Client;
  items: SaleItem[];
  total: number;
  profit: number;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "border border-border bg-surface p-5"}>
      {!compact && (
        <p className="mb-2 text-[13px] text-text-muted">
          Para <span className="font-bold text-text-primary">{client.name}</span>
        </p>
      )}
      <ul className="border-t-2 border-primary text-[14px] tabular-nums">
        {items.map((item) => (
          <li key={item.productId}>
            {item.qty > 0 && (
              <div className="flex justify-between gap-3 border-b border-border-soft py-2">
                <span className="min-w-0 truncate">
                  {item.productName} <span className="text-text-muted">×{item.qty}</span>
                </span>
                <span className="shrink-0 font-semibold">{formatMXNc(item.qty * item.unitPrice)}</span>
              </div>
            )}
            {(item.returnQty ?? 0) > 0 && (
              <div className="flex justify-between gap-3 border-b border-border-soft py-2 text-[13px] text-text-muted">
                <span className="min-w-0 truncate">
                  Cambio: {item.productName} ×{item.returnQty}
                </span>
                <span className="shrink-0">sin cobro</span>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="flex items-baseline justify-between gap-3 pt-3">
        <span className="text-[15px] font-bold">Total</span>
        <span className="text-[30px] font-black leading-none tracking-[-0.02em] tabular-nums">
          {formatMXNc(total)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-md bg-surface-2 px-3 py-2.5 text-[14px]">
        <span className="text-text-secondary">Te deja (ganancia bruta)</span>
        <span className="font-black text-accent-text tabular-nums">{formatMXNc(profit)}</span>
      </div>
    </div>
  );
}

function PaymentPicker({
  payment,
  setPayment,
  walkIn,
  compact,
}: {
  payment: PaymentMethod;
  setPayment: (payment: PaymentMethod) => void;
  walkIn: boolean;
  compact?: boolean;
}) {
  return (
    <fieldset>
      <legend className={`font-black ${compact ? "text-[15px]" : "text-[20px] tracking-[-0.01em]"}`}>
        ¿Cómo te pagaron?
      </legend>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {PAYMENT_OPTIONS.map(({ value, title, hint, icon: OptionIcon }) => {
          const selected = payment === value;
          const blocked = walkIn && DEFERRED_PAYMENTS.includes(value);
          return (
            <button
              type="button"
              key={value}
              role="radio"
              aria-checked={selected}
              disabled={blocked}
              onClick={() => setPayment(value)}
              className={`flex items-start gap-2.5 rounded-md border p-3 text-left transition active:scale-[0.98] disabled:opacity-40 ${
                compact ? "min-h-[60px]" : "min-h-[72px]"
              } ${selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface hover:border-text-primary"}`}
            >
              <OptionIcon weight={selected ? "fill" : "bold"} className="mt-0.5 h-5 w-5 shrink-0" />
              <span className="min-w-0">
                <span className="block text-[14px] font-bold leading-tight">{title}</span>
                <span className={`block text-[12px] ${selected ? "text-rail-muted" : "text-text-muted"}`}>
                  {hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {walkIn && (
        <p className="mt-2 text-[12px] text-text-muted">
          Para fiar o dejar en consignación, elige un cliente con nombre.
        </p>
      )}
      <button
        type="button"
        role="radio"
        aria-checked={payment === "Cortesía"}
        onClick={() => setPayment(payment === "Cortesía" ? "Efectivo" : "Cortesía")}
        className={`mt-2 inline-flex h-10 items-center gap-2 rounded-md px-2 text-[14px] font-semibold transition hover:bg-surface-2 ${
          payment === "Cortesía" ? "text-text-primary" : "text-text-secondary"
        }`}
      >
        <span
          className={`grid h-4 w-4 place-items-center rounded-sm border ${
            payment === "Cortesía" ? "border-primary bg-primary" : "border-border"
          }`}
        >
          {payment === "Cortesía" && <span className="h-1.5 w-1.5 bg-primary-foreground" />}
        </span>
        <GiftIcon weight="bold" className="h-4 w-4" />
        Es cortesía (sin cobro)
      </button>
    </fieldset>
  );
}

function MobileActionBar({
  step,
  total,
  soldCount,
  returnsCount,
  canContinue,
  isSubmitting,
  onNext,
  onConfirm,
}: {
  step: Step;
  total: number;
  soldCount: number;
  returnsCount: number;
  canContinue: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  onConfirm: () => void;
}) {
  const summary =
    soldCount + returnsCount === 0
      ? "Sin productos"
      : `${soldCount} ${soldCount === 1 ? "pieza" : "piezas"}${
          returnsCount > 0 ? ` · ${returnsCount} ${returnsCount === 1 ? "cambio" : "cambios"}` : ""
        }`;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 xl:hidden">
      <div className="mx-auto flex max-w-[560px] items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] text-text-muted">{summary}</p>
          <p key={total} className="text-[22px] font-black leading-tight tabular-nums animate-in fade-in duration-200">
            {formatMXNc(total)}
          </p>
        </div>
        {step === 2 ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={onNext}
            className={buttonClass({ variant: "cta", size: "lg", className: "min-w-[150px]" })}
          >
            Cobrar
            <ArrowRightIcon weight="bold" className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            disabled={!canContinue || isSubmitting}
            onClick={onConfirm}
            className={buttonClass({ variant: "cta", size: "lg", className: "min-w-[170px]" })}
          >
            {isSubmitting && <SpinnerGapIcon weight="bold" className="h-5 w-5 animate-spin" />}
            {isSubmitting ? "Guardando..." : "Guardar venta"}
          </button>
        )}
      </div>
    </div>
  );
}
