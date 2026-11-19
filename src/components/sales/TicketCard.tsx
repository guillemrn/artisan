import { forwardRef } from "react";
import { formatMXNc, isWalkInClient, type Sale } from "@/lib/artisan-data";
import {
  formatTicketDate,
  paymentLine,
  shortFolio,
  ticketState,
  type TicketState,
} from "@/lib/ticket-format";

const STAMP: Record<TicketState, { label: string; className: string }> = {
  paid: { label: "Pagado", className: "border-success text-success" },
  pending: { label: "Por cobrar", className: "border-warning text-warning" },
  consignment: { label: "Consignación", className: "border-info text-info" },
  courtesy: { label: "Cortesía", className: "border-text-muted text-text-muted" },
};

/**
 * El ticket que recibe el cliente (se exporta como imagen).
 * La marca protagonista es el negocio; Grofit solo firma al pie.
 */
export const TicketCard = forwardRef<
  HTMLDivElement,
  { sale: Sale; businessName: string; businessLine?: string; className?: string }
>(function TicketCard({ sale, businessName, businessLine, className }, ref) {
  const state = ticketState(sale);
  const stamp = STAMP[state];
  const owes = state === "pending" || state === "consignment";
  const walkIn = isWalkInClient(sale.clientId);

  return (
    <div
      ref={ref}
      className={`relative w-full max-w-[360px] border border-border bg-surface text-text-primary tabular-nums ${className ?? ""}`}
    >
      <div className="h-2 bg-primary" />
      <div className="px-5 pb-4 pt-5 sm:px-6">
        <p className="text-[26px] font-black leading-none tracking-[-0.02em] [overflow-wrap:anywhere]">
          {businessName}
        </p>
        {businessLine ? <p className="mt-1 text-[13px] text-text-muted">{businessLine}</p> : null}

        <dl className="mt-5 grid grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] gap-x-3 gap-y-2.5 text-[13px]">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
              Folio
            </dt>
            <dd className="mt-0.5 font-bold">{shortFolio(sale.id)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
              Fecha
            </dt>
            <dd className="mt-0.5 whitespace-nowrap font-bold">{formatTicketDate(sale.createdAt)}</dd>
          </div>
          {!walkIn && (
            <div className="col-span-2">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-text-muted">
                Cliente
              </dt>
              <dd className="mt-0.5 font-bold">{sale.clientName}</dd>
            </div>
          )}
        </dl>

        <div className="mt-4 border-t-2 border-primary text-[14px]">
          {sale.items.map((item) => (
            <div key={item.productId}>
              {item.qty > 0 && (
                <div className="border-b border-border-soft py-2.5">
                  <div className="flex justify-between gap-3 font-semibold">
                    <span className="min-w-0 [overflow-wrap:anywhere]">{item.productName}</span>
                    <span className="shrink-0">{formatMXNc(item.qty * item.unitPrice)}</span>
                  </div>
                  <p className="text-[12px] text-text-muted">
                    {item.qty} × {formatMXNc(item.unitPrice)}
                  </p>
                </div>
              )}
              {(item.returnQty ?? 0) > 0 && (
                <div className="flex justify-between gap-3 border-b border-border-soft py-2.5 text-[13px] text-text-muted">
                  <span className="min-w-0">
                    Cambio: {item.productName} ×{item.returnQty}
                  </span>
                  <span className="shrink-0">sin cargo</span>
                </div>
              )}
            </div>
          ))}

          <div className="flex items-baseline justify-between gap-3 pb-1.5 pt-3.5">
            <span className="text-[15px] font-bold">Total</span>
            <span className="text-[34px] font-black leading-none tracking-[-0.02em]">
              {formatMXNc(sale.total)}
            </span>
          </div>
          <div className="flex justify-between gap-3 text-[13px]">
            <span className="text-text-muted">Pago</span>
            <span className="font-semibold">{paymentLine(sale, state)}</span>
          </div>
          {owes && (
            <div className="mt-2 flex justify-between gap-3 rounded-sm bg-warning-bg px-2.5 py-2 text-[13px] font-bold text-warning">
              <span>Saldo pendiente</span>
              <span>{formatMXNc(sale.total)}</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-[14px] font-semibold">¡Gracias por tu compra!</p>
          <span
            className={`shrink-0 -rotate-[8deg] whitespace-nowrap rounded-sm border-[3px] px-2.5 py-1 text-[16px] font-black uppercase tracking-[0.06em] ${stamp.className}`}
          >
            {stamp.label}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 border-t border-dashed border-border px-3 py-2.5 text-[11px] text-text-muted">
        <span className="h-2 w-2 bg-cta" aria-hidden="true" />
        Hecho con Grofit · artisan.guillermoml.com
      </div>
    </div>
  );
});
