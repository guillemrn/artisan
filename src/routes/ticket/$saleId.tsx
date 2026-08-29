import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  Loader2,
  Plus,
  ReceiptText,
  Share2,
} from "lucide-react";
import { BUSINESS_NAME, formatMXN, formatMXNc } from "@/lib/artisan-data";
import { useArtisan } from "@/lib/artisan-store";
import { Logo } from "@/components/ui/logo";
import { toPng } from "html-to-image";
import { DataLoadError, DataLoadSkeleton } from "@/components/artisan/DataLoadState";
import { useAuth } from "@/core/auth/auth-context";

export const Route = createFileRoute("/ticket/$saleId")({
  head: () => ({ meta: [{ title: "Ticket — Artisan" }] }),
  component: Ticket,
});

function Ticket() {
  const { saleId } = Route.useParams();
  const { getSale, resetDraft, isLoading, loadError, lastSaleId } = useArtisan();
  const { user } = useAuth();
  const navigate = useNavigate();
  const sale = getSale(saleId);
  const isLatest = lastSaleId === saleId;
  const businessName = user?.user_metadata?.business_name || BUSINESS_NAME;

  const ticketRef = useRef<HTMLDivElement>(null);
  const [exportAction, setExportAction] = useState<"share" | "download" | null>(null);
  const [shareFeedback, setShareFeedback] = useState<"shared" | "downloaded" | null>(null);

  const getTicketBlob = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    if (!ticketRef.current) return null;
    const dataUrl = await toPng(ticketRef.current, {
      backgroundColor: "#ffffff",
      style: { margin: "0", boxShadow: "none" },
      pixelRatio: 2,
    });
    const response = await fetch(dataUrl);
    return { blob: await response.blob(), dataUrl };
  };

  const downloadTicket = (dataUrl: string) => {
    const link = document.createElement("a");
    link.download = `ticket-${saleId}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleDownloadImage = async () => {
    setExportAction("download");
    try {
      const data = await getTicketBlob();
      if (!data) return;
      downloadTicket(data.dataUrl);
      setShareFeedback("downloaded");
      window.setTimeout(() => setShareFeedback(null), 2400);
    } catch (error) {
      console.error("Error downloading image:", error);
    } finally {
      setExportAction(null);
    }
  };

  if (loadError) return <DataLoadError message={loadError} />;
  if (isLoading) return <DataLoadSkeleton variant="detail" title="Cargando ticket" />;

  if (!sale) {
    return (
      <div className="page-shell mx-auto max-w-3xl text-center md:px-0 md:pt-8">
        <ReceiptText className="mx-auto h-8 w-8 text-text-muted" />
        <h1 className="mt-4 text-xl font-bold text-text-primary">No encontramos este ticket</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Es posible que la venta ya no esté disponible.
        </p>
        <Link
          to="/app"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
      </div>
    );
  }

  const date = new Date(sale.createdAt);
  const dateStr = date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
  const soldCount = sale.items.reduce((sum, item) => sum + item.qty, 0);
  const returnCount = sale.items.reduce((sum, item) => sum + (item.returnQty ?? 0), 0);
  const shareText =
    `${businessName}\n${dateStr} ${timeStr}\nCliente: ${sale.clientName}\n\n` +
    sale.items
      .map((item) => {
        const lines = [];
        if (item.qty > 0) {
          lines.push(`${item.productName} x${item.qty} - ${formatMXNc(item.unitPrice * item.qty)}`);
        }
        if (item.returnQty && item.returnQty > 0) {
          lines.push(`[Cambio: ${item.returnQty} paq. de ${item.productName}]`);
        }
        return lines.join("\n");
      })
      .filter(Boolean)
      .join("\n") +
    `\n\nTotal: ${formatMXNc(sale.total)}\nPago: ${sale.payment}\n\n¡Gracias!`;

  const handleShareTicket = async () => {
    setExportAction("share");
    setShareFeedback(null);

    try {
      const data = await getTicketBlob();
      if (!data) return;
      const file = new File([data.blob], `ticket-${saleId}.png`, { type: data.blob.type });
      const canShareFile = navigator.canShare?.({ files: [file] }) ?? false;

      if (navigator.share) {
        await navigator.share({
          title: `Ticket ${businessName}`,
          text: shareText,
          ...(canShareFile ? { files: [file] } : {}),
        });
        setShareFeedback("shared");
      } else {
        downloadTicket(data.dataUrl);
        setShareFeedback("downloaded");
      }

      window.setTimeout(() => setShareFeedback(null), 2400);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Error sharing ticket:", error);

      const data = await getTicketBlob();
      if (data) {
        downloadTicket(data.dataUrl);
        setShareFeedback("downloaded");
        window.setTimeout(() => setShareFeedback(null), 2400);
      }
    } finally {
      setExportAction(null);
    }
  };

  return (
    <div className="page-shell mx-auto max-w-[1040px] md:px-0 md:pt-7">
      <header className="flex items-start gap-3 border-b border-border pb-5">
        <Link
          to="/ventas"
          aria-label="Volver a ventas"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border bg-white text-text-secondary transition hover:border-primary/30 hover:bg-primary-light focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-[24px] font-extrabold text-text-primary md:text-[28px]">
            {isLatest ? "Venta registrada" : "Ticket de venta"}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {isLatest
              ? "El inventario y el historial ya están actualizados."
              : `Venta ${sale.id} · ${dateStr}`}
          </p>
        </div>
      </header>

      <div className="mt-6 grid items-start gap-7 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:justify-center">
        <div className="rounded-lg border border-border bg-muted/55 p-3 sm:p-5">
          <div
            ref={ticketRef}
            className="mx-auto w-full max-w-[420px] bg-white px-5 py-6 shadow-[0_12px_28px_rgba(15,23,42,0.08)] sm:px-7"
            style={{
              border: "1px dashed #cbd5e1",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            <div className="flex flex-col items-center text-center">
              <Logo variant="icon" className="mb-2 h-8 w-8" />
              <p className="text-[15px] font-bold">{businessName}</p>
              <p className="mt-0.5 text-[11px] text-text-muted">
                {dateStr} · {timeStr}
              </p>
              <p className="mt-1 text-[10px] text-text-muted">{sale.id}</p>
            </div>

            <TicketRule />
            <p className="text-[12px]">
              Cliente: <span className="font-semibold">{sale.clientName}</span>
            </p>
            <p className="text-[12px]">
              Canal: <span className="font-semibold">{sale.channel}</span>
            </p>
            <TicketRule />

            <ul className="space-y-2.5 text-[12px]">
              {sale.items.map((item) => (
                <li key={item.productId}>
                  {item.qty > 0 && (
                    <div className="flex justify-between gap-3">
                      <span className="min-w-0">
                        {item.productName} <span className="text-text-muted">x{item.qty}</span>
                      </span>
                      <span className="shrink-0 font-semibold">
                        {formatMXNc(item.unitPrice * item.qty)}
                      </span>
                    </div>
                  )}
                  {Boolean(item.returnQty) && (
                    <div className="mt-1 flex justify-between gap-3 text-[11px] font-semibold text-warning">
                      <span>
                        Cambio: {item.productName} x{item.returnQty}
                      </span>
                      <span className="shrink-0">Sin cobro</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            <TicketRule />
            <div className="flex justify-between text-[15px] font-bold">
              <span>TOTAL</span>
              <span>{formatMXN(sale.total)}</span>
            </div>
            <p className="mt-1 text-[12px]">
              Pago: <span className="font-semibold">{sale.payment}</span>
            </p>
            <TicketRule />
            <p className="text-center text-[11px] text-text-muted">Gracias por tu preferencia</p>
          </div>
        </div>

        <aside className="overflow-hidden rounded-lg border border-border bg-white">
          <div className="border-b border-border px-5 py-5">
            <span
              className={`mb-4 grid h-12 w-12 place-items-center rounded-md animate-in fade-in zoom-in-75 duration-500 ${
                isLatest ? "bg-primary text-white shadow-fab" : "bg-primary-light text-primary"
              }`}
            >
              {isLatest ? <CheckCircle2 className="h-6 w-6" /> : <Share2 className="h-5 w-5" />}
            </span>
            <h2 className="text-xl font-bold text-text-primary">
              {isLatest ? "Todo quedó guardado" : "Ticket listo para compartir"}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-text-secondary">
              {isLatest
                ? "Puedes enviarlo ahora o empezar la siguiente venta."
                : "Envíalo a tu cliente o guarda una copia."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px border-b border-border bg-border">
            <div className="bg-white px-5 py-4">
              <p className="text-xs text-text-muted">Piezas</p>
              <p className="mt-1 text-lg font-extrabold text-text-primary">{soldCount}</p>
            </div>
            <div className="bg-white px-5 py-4">
              <p className="text-xs text-text-muted">Total</p>
              <p className="mt-1 text-lg font-extrabold text-primary">{formatMXN(sale.total)}</p>
            </div>
          </div>

          {returnCount > 0 && (
            <div className="flex items-center justify-between border-b border-border bg-[#fff9ed] px-5 py-3 text-sm">
              <span className="text-text-secondary">Cambios incluidos</span>
              <span className="font-bold text-warning">{returnCount}</span>
            </div>
          )}

          <div className="p-4">
            <button
              type="button"
              onClick={handleShareTicket}
              disabled={Boolean(exportAction)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white shadow-fab transition hover:bg-[#1d5a40] hover:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 disabled:opacity-60 disabled:shadow-none"
            >
              {exportAction === "share" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {exportAction === "share" ? "Preparando ticket..." : "Compartir ticket"}
            </button>

            <div className="mt-3 grid grid-cols-2 divide-x divide-border rounded-md border border-border bg-white">
              <button
                type="button"
                onClick={handleDownloadImage}
                disabled={Boolean(exportAction)}
                className="flex min-h-11 items-center justify-center gap-2 rounded-l-md px-3 text-center text-sm font-bold text-text-secondary transition hover:bg-muted focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 disabled:opacity-60"
              >
                {exportAction === "download" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Guardar PNG
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDraft();
                  navigate({ to: "/nueva-venta" });
                }}
                className="flex min-h-11 items-center justify-center gap-2 rounded-r-md px-3 text-center text-sm font-bold text-text-secondary transition hover:bg-primary-light hover:text-primary focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
              >
                <Plus className="h-4 w-4" />
                Nueva venta
              </button>
            </div>

            <p
              aria-live="polite"
              className="mt-3 min-h-5 text-center text-xs font-semibold text-primary"
            >
              {shareFeedback === "shared" && (
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Ticket compartido
                </span>
              )}
              {shareFeedback === "downloaded" && (
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> PNG guardado
                </span>
              )}
            </p>
          </div>
        </aside>
      </div>
      <div className="h-8" />
    </div>
  );
}

function TicketRule() {
  return <div className="my-4 border-t border-dashed border-border" />;
}
