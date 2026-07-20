import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, MessageCircle, Plus } from "lucide-react";
import { BUSINESS_NAME, formatMXN, formatMXNc } from "@/lib/artisan-data";
import { useArtisan } from "@/lib/artisan-store";
import { Logo } from "@/components/ui/logo";

export const Route = createFileRoute("/ticket/$saleId")({
  head: () => ({ meta: [{ title: "Ticket — Artisan" }] }),
  component: Ticket,
});

function Ticket() {
  const { saleId } = Route.useParams();
  const { getSale, resetDraft, isLoading, lastSaleId } = useArtisan();
  const navigate = useNavigate();
  const sale = getSale(saleId);
  const isLatest = lastSaleId === saleId;

  if (isLoading) {
    return (
      <div className="page-shell text-center md:px-0 md:pt-8">
        <p className="text-text-secondary">Cargando ticket…</p>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="page-shell text-center md:px-0 md:pt-8">
        <p className="text-text-secondary">No se encontró el ticket.</p>
        <Link
          to="/"
          className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  const d = new Date(sale.createdAt);
  const dateStr = d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const shareText = encodeURIComponent(
    `${BUSINESS_NAME}\n${dateStr} ${timeStr}\nCliente: ${sale.clientName}\n\n` +
      sale.items
        .map((i) => {
          let lines = [];
          if (i.qty > 0) {
            lines.push(`${i.productName} x${i.qty} - ${formatMXNc(i.unitPrice * i.qty)}`);
          }
          if (i.returnQty && i.returnQty > 0) {
            lines.push(`[Cambio: ${i.returnQty} paq. de ${i.productName}]`);
          }
          return lines.join("\n");
        })
        .filter(Boolean)
        .join("\n") +
      `\n\nTotal: ${formatMXNc(sale.total)}\nPago: ${sale.payment}\n\n¡Gracias!`,
  );

  return (
    <div className="page-shell md:px-0 md:pt-8">
      {isLatest && (
        <div className="flex items-center gap-3 rounded-2xl border border-success/25 bg-success/10 p-4">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-success text-white">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="font-bold text-success">¡Venta registrada!</p>
            <p className="text-[12px] text-text-secondary">
              Inventario actualizado automáticamente
            </p>
          </div>
        </div>
      )}

      <div
        className={`rounded-2xl bg-white p-5 shadow-sm md:mx-auto md:max-w-md ${isLatest ? "mt-4" : ""}`}
        style={{
          border: "1px dashed #cbd5e1",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <Logo variant="icon" className="mb-2 h-8 w-8" />
          <p className="text-[15px] font-bold">{BUSINESS_NAME}</p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {dateStr} · {timeStr}
          </p>
        </div>

        <div className="my-3 border-t border-dashed border-border" />

        <p className="text-[12px]">
          Cliente: <span className="font-semibold">{sale.clientName}</span>
        </p>
        <p className="text-[12px]">
          Canal: <span className="font-semibold">{sale.channel}</span>
        </p>

        <div className="my-3 border-t border-dashed border-border" />

        <ul className="space-y-2 text-[12px]">
          {sale.items.map((i) => (
            <li key={i.productId} className="border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
              {i.qty > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="truncate">
                    {i.productName} <span className="text-text-muted">x{i.qty}</span>
                  </span>
                  <span className="font-semibold">{formatMXNc(i.unitPrice * i.qty)}</span>
                </div>
              )}
              {i.returnQty && i.returnQty > 0 && (
                <div className="flex justify-between gap-2 text-warning font-semibold text-[11px] mt-0.5">
                  <span>Cambio: {i.productName} x{i.returnQty}</span>
                  <span>(Merma)</span>
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="my-3 border-t border-dashed border-border" />

        <div className="flex justify-between text-[14px] font-bold">
          <span>TOTAL</span>
          <span>{formatMXN(sale.total)}</span>
        </div>
        <p className="mt-1 text-[12px]">
          Pago: <span className="font-semibold">{sale.payment}</span>
        </p>

        <div className="my-3 border-t border-dashed border-border" />

        <p className="text-center text-[11px] text-text-muted">Gracias por tu preferencia</p>
      </div>

      <div className="mt-4 space-y-2 md:mx-auto md:max-w-md">
        <a
          href={`https://wa.me/?text=${shareText}`}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 text-center text-[14px] font-bold text-white transition hover:bg-[#246448]"
        >
          <MessageCircle className="h-4 w-4" />
          Compartir por WhatsApp
        </a>
        <button
          onClick={() => {
            resetDraft();
            navigate({ to: "/nueva-venta" });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-white py-3 text-center text-[14px] font-bold text-primary transition hover:bg-primary-light"
        >
          <Plus className="h-4 w-4" />
          Nueva venta
        </button>
      </div>
      <div className="h-8" />
    </div>
  );
}
