import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Search, Store, User, Plus, Minus } from "lucide-react";
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

  const items = useMemo(
    () => buildSaleItems(draft.quantities, draft.priceMode, products),
    [draft.quantities, draft.priceMode, products],
  );
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const cost = items.reduce((s, i) => s + i.cost * i.qty, 0);
  const profit = subtotal - cost;
  const margin = subtotal > 0 ? Math.round((profit / subtotal) * 100) : 0;

  const canContinue1 = !!draft.client;
  const canContinue2 = items.length > 0;

  const confirm = () => {
    if (!draft.client) return;

    // Generate dynamic prefix from business name
    const bizName = user?.user_metadata?.business_name || "Artisan";
    const prefix = bizName
      .slice(0, 3)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "X")
      .padEnd(3, "X");

    // Calculate sequential number for real sales (excluding s1-s4 seed data)
    const realSales = sales.filter((s) => !["s1", "s2", "s3", "s4"].includes(s.id));
    const nextNum = realSales.length + 1;
    const paddedNum = String(nextNum).padStart(4, "0");
    const id = `${prefix}-${paddedNum}`;

    addSale({
      id,
      clientId: draft.client.id,
      clientName: draft.client.name,
      channel: draft.client.channel,
      items,
      total: subtotal,
      cost,
      profit,
      payment: draft.payment,
      status: draft.payment === "Pendiente" ? "Pendiente" : "Entregado",
      createdAt: new Date().toISOString(),
    });
    navigate({ to: "/ticket/$saleId", params: { saleId: id } });
  };

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
        />
      )}
      {step === 3 && (
        <StepConfirm
          clientName={draft.client!.name}
          channel={draft.client!.channel}
          items={items}
          subtotal={subtotal}
          cost={cost}
          profit={profit}
          margin={margin}
          payment={draft.payment}
          setPayment={(p) => setDraft((d) => ({ ...d, payment: p }))}
        />
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-20 left-1/2 w-full max-w-[430px] -translate-x-1/2 px-5 md:static md:left-auto md:mt-6 md:max-w-none md:translate-x-0 md:px-0">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3 shadow-[0_-2px_16px_rgba(15,23,42,0.08)] md:shadow-sm">
          {step === 2 && (
            <div className="flex-1">
              <p className="text-[11px] text-text-muted">Subtotal</p>
              <p className="text-[16px] font-bold">{formatMXN(subtotal)}</p>
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
}: {
  client: Client;
  priceMode: "distributor" | "public";
  setPriceMode: (m: "distributor" | "public") => void;
  quantities: Record<string, number>;
  setQty: (id: string, qty: number) => void;
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
          const active = qty > 0;
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
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => setQty(p.id, qty - 1)}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-white disabled:opacity-40"
                  disabled={qty === 0}
                  aria-label="Restar"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[28px] text-center text-[14px] font-semibold">{qty}</span>
                <button
                  onClick={() => setQty(p.id, qty + 1)}
                  disabled={qty >= p.stock}
                  className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white disabled:opacity-40"
                  aria-label="Sumar"
                >
                  <Plus className="h-4 w-4" />
                </button>
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
  cost,
  profit,
  margin,
  payment,
  setPayment,
}: {
  clientName: string;
  channel: "PDV" | "Público";
  items: { productName: string; qty: number; unitPrice: number }[];
  subtotal: number;
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
              <th className="text-center font-semibold pb-2">Cant.</th>
              <th className="text-right font-semibold pb-2">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.productName} className="border-t border-border/80">
                <td className="py-2">
                  <p className="font-medium">{i.productName}</p>
                  <p className="text-[11px] text-text-muted">{formatMXNc(i.unitPrice)} c/u</p>
                </td>
                <td className="text-center">{i.qty}</td>
                <td className="text-right font-semibold">{formatMXN(i.unitPrice * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 border-t border-border pt-3 space-y-1 text-[13px]">
          <Row label="Subtotal" value={formatMXN(subtotal)} />
          <Row label="Costo producción" value={formatMXN(cost)} muted />
          <Row label="Ganancia" value={formatMXN(profit)} accent="text-success" bold />
          <Row label="Margen" value={`${margin}%`} muted />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <p className="text-[12px] font-semibold text-text-muted mb-2">MÉTODO DE PAGO</p>
        <div className="grid grid-cols-3 gap-2">
          {(["Efectivo", "Transferencia", "Pendiente"] as PaymentMethod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPayment(p)}
              className={`rounded-full py-2 text-[12px] font-semibold border transition ${
                payment === p
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-text-secondary border-border"
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
