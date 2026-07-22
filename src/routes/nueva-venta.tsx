import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Search, Store, User, Plus, Minus, AlertCircle } from "lucide-react";
import { AddClientSheet } from "@/components/artisan/AddClientSheet";
import {
  formatMXN,
  formatMXNc,
  type Client,
  type PaymentMethod,
  type Product,
} from "@/lib/artisan-data";
import { buildSaleItems, useArtisan } from "@/lib/artisan-store";
import { useAuth } from "@/core/auth/auth-context";

export const Route = createFileRoute("/nueva-venta")({
  head: () => ({ meta: [{ title: "Nueva venta — Artisan" }] }),
  component: NuevaVenta,
});

function NuevaVenta() {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { draft, setDraft, resetDraft, addSale, products, sales } = useArtisan();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const items = useMemo(
    () => buildSaleItems(draft.quantities, draft.returns || {}, draft.priceMode, products),
    [draft.quantities, draft.returns, draft.priceMode, products],
  );
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const returnsTotal = items.reduce((s, i) => s + i.unitPrice * (i.returnQty ?? 0), 0);
  const netTotal = draft.payment === "Cortesía" ? 0 : subtotal; // Cortesías charge 0, but track cost
  const cost = items.reduce((s, i) => s + i.cost * i.qty, 0);
  const profit = netTotal - cost;
  const margin = netTotal > 0 ? Math.round((profit / netTotal) * 100) : 0;

  const canContinue1 = !!draft.client;
  const canContinue2 = items.length > 0;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirm = async () => {
    if (!draft.client) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Generate dynamic prefix from business name
      const bizName = user?.user_metadata?.business_name || "Artisan";
      const prefix = bizName
        .slice(0, 3)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "X")
        .padEnd(3, "X");

      // Find the maximum existing numeric suffix for this prefix to ensure uniqueness
      const prefixSales = sales.filter((s) => s.id.startsWith(`${prefix}-`));
      let maxNum = 0;
      for (const s of prefixSales) {
        const parts = s.id.split("-");
        const suffix = parts[parts.length - 1];
        const parsed = parseInt(suffix, 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
      const nextNum = maxNum + 1;
      const paddedNum = String(nextNum).padStart(4, "0");
      const id = `${prefix}-${paddedNum}`;

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
        status: (draft.payment === "Pendiente" || draft.payment === "Consignación") ? "Pendiente" : "Entregado",
        createdAt: new Date().toISOString(),
      });
      resetDraft();
      navigate({ to: "/ticket/$saleId", params: { saleId: id } });
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : "Error desconocido al registrar la venta");
    }
  };

  if (isSubmitting) {
    return (
      <div className="page-shell flex flex-col items-center justify-center min-h-[60vh] text-center md:px-0 md:pt-8">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
        <h2 className="text-lg font-bold text-text-primary">Registrando venta...</h2>
        <p className="text-sm text-text-muted mt-1">Guardando información y actualizando inventario.</p>
      </div>
    );
  }

  return (
    <div className="page-shell md:px-0 md:pt-8">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-sm md:p-4">
        {step === 1 ? (
          <Link
            to="/"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border text-text-secondary transition hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <button
            onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-border text-text-secondary transition hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1">
          <p className="text-[12px] font-bold text-primary">Paso {step} de 3</p>
          <h1 className="text-[19px] font-bold text-text-primary">
            {step === 1
              ? "Selecciona cliente"
              : step === 2
                ? "Agrega productos"
                : "Confirmar venta"}
          </h1>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-2 flex-1 rounded-full ${n <= step ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>

      {step === 1 && (
        <StepClient
          onPick={(c) => setDraft((d) => ({ ...d, client: c }))}
          selectedId={draft.client?.id}
        />
      )}
      {step === 2 && (
        <StepProducts
          client={draft.client!}
          priceMode={draft.priceMode}
          setPriceMode={(m) => setDraft((d) => ({ ...d, priceMode: m }))}
          quantities={draft.quantities}
          setQty={(id, qty) =>
            setDraft((d) => ({
              ...d,
              quantities: { ...d.quantities, [id]: Math.max(0, qty) },
            }))
          }
          returns={draft.returns || {}}
          setReturnQty={(id, qty) =>
            setDraft((d) => ({
              ...d,
              returns: { ...d.returns || {}, [id]: Math.max(0, qty) },
            }))
          }
        />
      )}
      {step === 3 && (
        <div className="space-y-4">
          {submitError && (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">No se pudo guardar la venta</p>
                <p className="text-[12px] text-destructive/90 mt-0.5">{submitError}</p>
              </div>
            </div>
          )}
          <StepConfirm
            clientName={draft.client!.name}
            channel={draft.client!.channel}
            items={items}
            subtotal={netTotal}
            returnsTotal={returnsTotal}
            cost={cost}
            profit={profit}
            margin={margin}
            payment={draft.payment}
            setPayment={(p) => setDraft((d) => ({ ...d, payment: p }))}
          />
        </div>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-20 left-1/2 w-full max-w-[430px] -translate-x-1/2 px-5 md:static md:left-auto md:mt-6 md:max-w-none md:translate-x-0 md:px-0">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-[0_-2px_16px_rgba(15,23,42,0.08)] md:shadow-sm">
          {step === 2 && (
            <div className="flex-1">
              <p className="text-[11px] text-text-muted">Total Venta</p>
              <p className="text-[16px] font-bold">
                {formatMXN(subtotal)}
                {returnsTotal > 0 && (
                  <span className="text-[11px] font-medium text-warning ml-1.5">
                    ({items.reduce((acc, x) => acc + (x.returnQty ?? 0), 0)} cambios)
                  </span>
                )}
              </p>
            </div>
          )}
          {step === 3 && (
            <button
              onClick={() => {
                resetDraft();
                navigate({ to: "/" });
              }}
              className="flex-1 py-3 text-[14px] font-semibold text-text-secondary"
            >
              Regresar
            </button>
          )}
          {step < 3 ? (
            <button
              disabled={step === 1 ? !canContinue1 : !canContinue2}
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              className="ml-auto rounded-xl bg-primary px-5 py-3 text-[14px] font-bold text-white transition hover:bg-[#246448] disabled:opacity-40"
            >
              Continuar
            </button>
          ) : (
            <button
              onClick={confirm}
              className="flex-1 rounded-xl bg-success px-4 py-3 text-[14px] font-bold text-white transition hover:bg-[#246448]"
            >
              Confirmar y generar ticket
            </button>
          )}
        </div>
      </div>
      <div className="h-32 md:hidden" />
    </div>
  );
}

function StepClient({ onPick, selectedId }: { onPick: (c: Client) => void; selectedId?: string }) {
  const { clients, addClient } = useArtisan();
  const [q, setQ] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="relative mt-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cliente..."
          className="h-11 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-[14px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>
      <p className="mt-5 text-[12px] font-bold tracking-wide text-text-muted">RECIENTES</p>
      <ul className="mt-2 grid gap-2 md:grid-cols-2">
        {filtered.map((c) => (
          <li key={c.id}>
            <button
              onClick={() => onPick(c)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
                selectedId === c.id
                  ? "border-primary bg-primary-light"
                  : "border-border bg-white hover:border-primary/40"
              }`}
            >
              <div
                className={`grid h-10 w-10 place-items-center rounded-xl ${
                  c.channel === "PDV"
                    ? "bg-primary-light text-primary"
                    : "bg-[#FBF0E8] text-[#C9784A]"
                }`}
              >
                {c.channel === "PDV" ? <Store className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold truncate">{c.name}</p>
                <p className="text-[12px] text-text-muted truncate">Última: {c.lastDelivery}</p>
              </div>
              <span
                className={`rounded-full text-[10px] font-semibold px-2 py-0.5 ${
                  c.channel === "PDV"
                    ? "bg-primary-light text-primary"
                    : "bg-[#FBF0E8] text-[#C9784A]"
                }`}
              >
                {c.channel}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => setShowAddForm(true)}
        className="mt-4 w-full rounded-xl border border-dashed border-primary/35 bg-white py-3 text-[14px] font-bold text-primary transition hover:bg-primary-light/40"
      >
        + Nuevo cliente
      </button>

      <AddClientSheet
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSave={addClient}
        onCreated={onPick}
        lastDeliveryLabel="Nueva incorporación"
      />
    </div>
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
}: {
  client: Client;
  priceMode: "distributor" | "public";
  setPriceMode: (m: "distributor" | "public") => void;
  quantities: Record<string, number>;
  setQty: (id: string, qty: number) => void;
  returns: Record<string, number>;
  setReturnQty: (id: string, qty: number) => void;
}) {
  const { products } = useArtisan();
  return (
    <div className="mt-5">
      <p className="text-[13px] text-text-secondary">
        Cliente: <span className="font-semibold text-text-primary">{client.name}</span>
      </p>

      {/* Toggle */}
      <div className="mt-3 grid grid-cols-2 rounded-xl border border-border bg-white p-1">
        {(["distributor", "public"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setPriceMode(m)}
            className={`py-2 text-[13px] font-semibold rounded-lg transition ${
              priceMode === m ? "bg-primary text-white" : "text-text-secondary"
            }`}
          >
            {m === "distributor" ? "Precio distribuidor" : "Precio público"}
          </button>
        ))}
      </div>

      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {products.map((p) => {
          const qty = quantities[p.id] ?? 0;
          const retQty = returns[p.id] ?? 0;
          const active = qty > 0 || retQty > 0;
          const price = priceMode === "distributor" ? p.distributorPrice : p.publicPrice;
          return (
            <li
              key={p.id}
              className={`rounded-2xl border px-3.5 py-3 transition ${
                active
                  ? "border-primary bg-primary-light"
                  : "border-border bg-white hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate">{p.name}</p>
                  <p className="text-[12px] text-text-muted">Stock: {p.stock}</p>
                </div>
                <p className="text-[14px] font-bold text-text-primary">{formatMXN(price)}</p>
              </div>

              {/* Fresh Sales Row Controls */}
              <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[13px]">
                <span className="text-text-muted font-medium">Entregar (Venta):</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQty(p.id, qty - 1)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-white disabled:opacity-40"
                    disabled={qty === 0}
                    aria-label="Restar venta"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[20px] text-center font-bold">{qty}</span>
                  <button
                    onClick={() => setQty(p.id, qty + 1)}
                    disabled={qty >= p.stock}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white disabled:opacity-40"
                    aria-label="Sumar venta"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Product Exchange / Returns Row Controls */}
              <div className="mt-2 flex items-center justify-between text-[13px]">
                <span className="text-text-muted font-medium">Cambio (Merma):</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReturnQty(p.id, retQty - 1)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-white disabled:opacity-40"
                    disabled={retQty === 0}
                    aria-label="Restar devolución"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-[20px] text-center font-bold text-warning">{retQty}</span>
                  <button
                    onClick={() => setReturnQty(p.id, retQty + 1)}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-warning text-white"
                    aria-label="Sumar devolución"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StepConfirm({
  clientName,
  channel,
  items,
  subtotal,
  returnsTotal,
  cost,
  profit,
  margin,
  payment,
  setPayment,
}: {
  clientName: string;
  channel: "PDV" | "Público";
  items: { productName: string; qty: number; returnQty?: number; unitPrice: number }[];
  subtotal: number;
  returnsTotal: number;
  cost: number;
  profit: number;
  margin: number;
  payment: PaymentMethod;
  setPayment: (p: PaymentMethod) => void;
}) {
  return (
    <div className="mt-5 space-y-3">
      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <p className="text-[12px] text-text-muted">Cliente</p>
        <p className="text-[15px] font-semibold">{clientName}</p>
        <span className="mt-1 inline-block rounded-full bg-primary-light text-primary text-[10px] font-semibold px-2 py-0.5">
          {channel}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-text-muted text-[11px] uppercase">
              <th className="text-left font-semibold pb-2">Producto</th>
              <th className="text-center font-semibold pb-2">Movimiento</th>
              <th className="text-right font-semibold pb-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const itemSubtotal = i.qty * i.unitPrice;
              const itemReturnCredit = (i.returnQty ?? 0) * i.unitPrice;
              return (
                <tr key={i.productName} className="border-t border-border/80">
                  <td className="py-2">
                    <p className="font-medium">{i.productName}</p>
                    <p className="text-[11px] text-text-muted">{formatMXNc(i.unitPrice)} c/u</p>
                  </td>
                  <td className="text-center py-2 text-[12px] leading-tight">
                    {i.qty > 0 && <div className="font-semibold text-emerald-700">Venta: {i.qty}</div>}
                    {(i.returnQty ?? 0) > 0 && <div className="font-semibold text-warning">Cambio: {i.returnQty}</div>}
                  </td>
                  <td className="text-right font-semibold py-2">
                    {i.qty > 0 && <div className="text-emerald-700">+{formatMXN(itemSubtotal)}</div>}
                    {(i.returnQty ?? 0) > 0 && <div className="text-warning">-{formatMXN(itemReturnCredit)}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-3 border-t border-border pt-3 space-y-1.5 text-[13px]">
          {/* Internal Business Metrics (smaller/muted for lower cognitive load) */}
          <div className="bg-gray-50 rounded-xl p-3 mb-2 space-y-1 border border-border/40 text-[12px]">
            <Row label="Costo de producción" value={formatMXN(cost)} muted />
            <Row label="Ganancia estimada" value={formatMXN(profit)} accent="text-emerald-700" />
            <Row label="Margen estimado" value={`${margin}%`} muted />
          </div>

          {/* Operational summaries */}
          {returnsTotal > 0 && (
            <Row
              label="Cambios registrados"
              value={`${items.reduce((acc, x) => acc + (x.returnQty ?? 0), 0)} paquetes`}
              accent="text-warning font-semibold"
            />
          )}

          {/* Big Separator and Grand Total */}
          <div className="pt-2.5 border-t border-border flex items-center justify-between">
            <span className="text-[14px] font-bold text-text-primary">Total a Cobrar:</span>
            <span className="text-[20px] font-extrabold text-primary font-display">
              {formatMXN(subtotal)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <p className="text-[12px] font-semibold text-text-muted mb-2.5">MÉTODO DE PAGO</p>
        <div className="flex flex-wrap gap-2">
          {(["Efectivo", "Transferencia", "Pendiente", "Consignación", "Cortesía"] as PaymentMethod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPayment(p)}
              className={`rounded-xl px-4 py-2.5 text-[12px] font-semibold border transition ${
                payment === p
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-surface text-text-secondary border-border hover:bg-muted"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  bold,
  accent,
}: {
  label: string;
  value: string;
  muted?: boolean;
  bold?: boolean;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-text-muted" : "text-text-secondary"}>{label}</span>
      <span className={`${bold ? "font-bold" : "font-semibold"} ${accent ?? "text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}
