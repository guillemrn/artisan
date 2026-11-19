import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CaretDownIcon, ReceiptIcon } from "@phosphor-icons/react";
import { clsx } from "clsx";

import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button-styles";
import { formatMXNc, type Sale } from "@/lib/artisan-data";
import {
  channelLabel,
  isCollectable,
  saleDates,
  saleItemsSummary,
  saleStatus,
} from "@/lib/sale-display";

export type SalesTableColumn = "date" | "client" | "items" | "payment" | "status" | "total";

const ALL_COLUMNS: SalesTableColumn[] = ["date", "client", "items", "payment", "status", "total"];

/**
 * Lista de ventas reutilizable (dashboard, Ventas, detalle de cliente…).
 * Escritorio: tabla con reglas. Móvil: filas compactas con Cobrar visible y detalle desplegable.
 * La pantalla decide qué hacer al cobrar (onCobrar) y qué columnas mostrar.
 */
export function SalesTable({
  sales,
  onCobrar,
  columns = ALL_COLUMNS,
  caption = "Ventas",
  emptyMessage = "Todavía no hay ventas en este periodo.",
  layout = "auto",
}: {
  sales: Sale[];
  onCobrar?: (sale: Sale) => void;
  columns?: SalesTableColumn[];
  caption?: string;
  emptyMessage?: string;
  /** "auto": tabla en escritorio y lista en móvil. "list": siempre lista (modales, columnas angostas). */
  layout?: "auto" | "list";
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const show = (c: SalesTableColumn) => columns.includes(c);

  if (sales.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-lg bg-surface-2 px-4 py-6 text-[14px] text-text-muted">
        <ReceiptIcon className="h-5 w-5 shrink-0" />
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      {/* Escritorio */}
      <div className={clsx("hidden overflow-x-auto", layout === "auto" && "md:block")}>
        <table className="w-full border-collapse text-left text-[14px] tabular-nums">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-text-primary text-[12px] font-semibold text-text-muted">
              {show("date") && <th className="py-2.5 pr-4 font-semibold">Fecha</th>}
              {show("client") && <th className="px-4 py-2.5 font-semibold">Cliente</th>}
              {show("items") && <th className="px-4 py-2.5 font-semibold">Productos</th>}
              {show("payment") && <th className="px-4 py-2.5 font-semibold">Pago</th>}
              {show("status") && <th className="px-4 py-2.5 font-semibold">Estado</th>}
              {show("total") && <th className="px-4 py-2.5 text-right font-semibold">Total</th>}
              <th className="py-2.5 pl-4 text-right font-semibold">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => {
              const dates = saleDates(s);
              const items = saleItemsSummary(s);
              const status = saleStatus(s);
              return (
                <tr
                  key={s.id}
                  className="border-b border-border-soft align-top transition-colors hover:bg-surface-2"
                >
                  {show("date") && (
                    <td className="whitespace-nowrap py-3 pr-4">
                      <span className="block font-medium">{dates.day}</span>
                      <span className="block text-[12px] text-text-muted">{dates.time}</span>
                      {dates.deliveredLabel && (
                        <span className="block text-[12px] text-text-muted">
                          {dates.deliveredLabel}
                        </span>
                      )}
                    </td>
                  )}
                  {show("client") && (
                    <td className="px-4 py-3">
                      <span className="block font-semibold">{s.clientName}</span>
                      <span className="block text-[12px] text-text-muted">
                        {channelLabel(s.channel)}
                      </span>
                    </td>
                  )}
                  {show("items") && (
                    <td className="max-w-[340px] px-4 py-3">
                      {items.sold && <span className="block">{items.sold}</span>}
                      {items.changes && (
                        <span className="block text-[13px] text-warning">
                          Cambio: {items.changes}
                        </span>
                      )}
                    </td>
                  )}
                  {show("payment") && (
                    <td className="whitespace-nowrap px-4 py-3 text-text-secondary">{s.payment}</td>
                  )}
                  {show("status") && (
                    <td className="px-4 py-3">
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </td>
                  )}
                  {show("total") && (
                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold">
                      {formatMXNc(s.total)}
                    </td>
                  )}
                  <td className="py-2 pl-4">
                    <SaleActions sale={s} onCobrar={onCobrar} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Móvil */}
      <ul
        className={clsx("border-t border-text-primary", layout === "auto" && "md:hidden")}
        aria-label={caption}
      >
        {sales.map((s) => {
          const dates = saleDates(s);
          const items = saleItemsSummary(s);
          const status = saleStatus(s);
          const open = openId === s.id;
          return (
            <li key={s.id} className="border-b border-border-soft">
              <button
                type="button"
                onClick={() => setOpenId(open ? null : s.id)}
                aria-expanded={open}
                className="flex w-full items-start gap-3 py-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-semibold">{s.clientName}</span>
                    <span className="shrink-0 font-bold tabular-nums">{formatMXNc(s.total)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-text-muted">
                    {items.sold || (items.changes ? `Cambio: ${items.changes}` : "")}
                  </span>
                  <span className="mt-1.5 flex items-center justify-between gap-3">
                    <span className="text-[12px] text-text-muted">
                      {dates.day} · {dates.time}
                    </span>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </span>
                </span>
                <CaretDownIcon
                  className={clsx(
                    "mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform",
                    open && "rotate-180",
                  )}
                />
              </button>

              {open && (
                <div className="space-y-2 pb-3 text-[14px]">
                  <dl className="grid grid-cols-2 gap-y-1 rounded-md bg-surface-2 px-3 py-2.5">
                    <dt className="text-text-muted">Cliente</dt>
                    <dd className="text-right">{channelLabel(s.channel)}</dd>
                    <dt className="text-text-muted">Pago</dt>
                    <dd className="text-right">{s.payment}</dd>
                    {items.changes && (
                      <>
                        <dt className="text-text-muted">Cambio</dt>
                        <dd className="text-right text-warning">{items.changes}</dd>
                      </>
                    )}
                    <dt className="text-text-muted">Ganancia bruta</dt>
                    <dd className="text-right font-semibold tabular-nums">
                      {formatMXNc(s.profit)}
                    </dd>
                    {dates.deliveredLabel && (
                      <>
                        <dt className="text-text-muted">Entrega</dt>
                        <dd className="text-right">
                          {dates.deliveredLabel.replace("Entrega ", "")}
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              )}

              {(open || isCollectable(s)) && (
                <div className="pb-3">
                  <SaleActions sale={s} onCobrar={onCobrar} block />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function SaleActions({
  sale,
  onCobrar,
  block = false,
}: {
  sale: Sale;
  onCobrar?: (sale: Sale) => void;
  block?: boolean;
}) {
  return (
    <div className={clsx("flex gap-2", block ? "" : "justify-end")}>
      {onCobrar && isCollectable(sale) && (
        <button
          type="button"
          onClick={() => onCobrar(sale)}
          className={buttonClass({
            variant: "primary",
            size: "sm",
            className: block ? "flex-1" : "",
          })}
        >
          Cobrar
        </button>
      )}
      <Link
        to="/ticket/$saleId"
        params={{ saleId: sale.id }}
        aria-label={`Ver ticket de ${sale.clientName}`}
        className={buttonClass({ variant: "secondary", size: "sm" })}
      >
        <ReceiptIcon className="h-4 w-4" />
        Ticket
      </Link>
    </div>
  );
}
