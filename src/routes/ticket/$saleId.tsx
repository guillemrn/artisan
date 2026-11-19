import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CaretLeftIcon,
  CheckIcon,
  CopyIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  PlusIcon,
  ReceiptIcon,
  SpinnerGapIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";
import { toPng } from "html-to-image";
import { BUSINESS_NAME, formatMXN, isWalkInClient } from "@/lib/artisan-data";
import { useArtisan } from "@/lib/artisan-store";
import { DataLoadError, DataLoadSkeleton } from "@/components/artisan/DataLoadState";
import { useAuth } from "@/core/auth/auth-context";
import { buttonClass } from "@/components/ui/button-styles";
import { useCountUp } from "@/lib/use-count-up";
import { TicketCard } from "@/components/sales/TicketCard";
import { shortFolio, ticketMessage, ticketState } from "@/lib/ticket-format";

export const Route = createFileRoute("/ticket/$saleId")({
  head: () => ({ meta: [{ title: "Ticket — Artisan" }] }),
  component: Ticket,
});

type Feedback = "shared" | "downloaded" | "copied" | null;

function Ticket() {
  const { saleId } = Route.useParams();
  const { getSale, resetDraft, isLoading, loadError, lastSaleId } = useArtisan();
  const { user } = useAuth();
  const navigate = useNavigate();
  const sale = getSale(saleId);
  const justSaved = lastSaleId === saleId;
  const businessName = user?.user_metadata?.business_name || BUSINESS_NAME;
  const businessLine: string | undefined = user?.user_metadata?.business_type || undefined;

  const ticketRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"share" | "download" | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2400);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  if (loadError) return <DataLoadError message={loadError} />;
  if (isLoading) return <DataLoadSkeleton variant="detail" title="Cargando ticket" />;

  if (!sale) {
    return (
      <div className="page-shell mx-auto max-w-3xl py-16 text-center">
        <ReceiptIcon weight="bold" className="mx-auto h-8 w-8 text-text-muted" />
        <h1 className="mt-4 text-[20px] font-black">No encontramos este ticket</h1>
        <p className="mt-2 text-[14px] text-text-secondary">Es posible que la venta ya no exista.</p>
        <Link to="/app" className={buttonClass({ variant: "primary", className: "mt-5" })}>
          Volver al inicio
        </Link>
      </div>
    );
  }

  const fileName = `ticket-${shortFolio(sale.id)}.png`;
  const message = ticketMessage(sale, businessName);

  const renderImage = async () => {
    if (!ticketRef.current) return null;
    const dataUrl = await toPng(ticketRef.current, { pixelRatio: 2, cacheBust: true });
    const blob = await (await fetch(dataUrl)).blob();
    return { dataUrl, file: new File([blob], fileName, { type: "image/png" }) };
  };

  const download = (dataUrl: string) => {
    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  };

  // En el celular abre la hoja de compartir con la imagen (elige WhatsApp).
  // Si el navegador no comparte archivos, guarda la imagen y abre WhatsApp con el mensaje.
  const sendWhatsApp = async () => {
    setBusy("share");
    try {
      const image = await renderImage();
      if (!image) return;
      if (navigator.canShare?.({ files: [image.file] })) {
        await navigator.share({ files: [image.file], text: message });
        setFeedback("shared");
      } else {
        download(image.dataUrl);
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
        setFeedback("downloaded");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) console.error(error);
    } finally {
      setBusy(null);
    }
  };

  const saveImage = async () => {
    setBusy("download");
    try {
      const image = await renderImage();
      if (image) {
        download(image.dataUrl);
        setFeedback("downloaded");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBusy(null);
    }
  };

  const copyText = async () => {
    setMenuOpen(false);
    try {
      await navigator.clipboard.writeText(message);
      setFeedback("copied");
    } catch (error) {
      console.error(error);
    }
  };

  const anotherSale = () => {
    resetDraft();
    navigate({ to: "/nueva-venta" });
  };

  const whatsappButton = (
    <button
      type="button"
      onClick={sendWhatsApp}
      disabled={Boolean(busy)}
      className={buttonClass({ variant: "cta", size: "lg", block: true })}
    >
      {busy === "share" ? (
        <SpinnerGapIcon weight="bold" className="h-5 w-5 animate-spin" />
      ) : (
        <WhatsappLogoIcon weight="fill" className="h-5 w-5" />
      )}
      {busy === "share" ? "Preparando..." : "Mandar por WhatsApp"}
    </button>
  );

  return (
    <div className="page-shell mx-auto max-w-[1100px] md:px-0 md:pt-6">
      <header className="flex items-center gap-2">
        <Link
          to="/ventas"
          aria-label="Volver a ventas"
          className="-ml-2 grid h-11 w-11 shrink-0 place-items-center rounded-md transition hover:bg-surface-2"
        >
          <CaretLeftIcon weight="bold" className="h-5 w-5" />
        </Link>
        <h1 className="text-[22px] font-black tracking-[-0.02em] md:text-[28px]">
          Ticket {shortFolio(sale.id)}
        </h1>
        <div className="relative ml-auto lg:hidden">
          <button
            type="button"
            aria-label="Más acciones"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center rounded-md transition hover:bg-surface-2"
          >
            <DotsThreeIcon weight="bold" className="h-6 w-6" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-12 z-20 w-52 border border-border bg-surface py-1 shadow-[0_12px_32px_rgba(17,17,17,0.12)] animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={copyText}
                className="flex h-11 w-full items-center gap-2.5 px-4 text-left text-[14px] font-semibold hover:bg-surface-2"
              >
                <CopyIcon weight="bold" className="h-4 w-4" />
                Copiar texto
              </button>
              <Link
                to="/ventas"
                className="flex h-11 w-full items-center gap-2.5 px-4 text-[14px] font-semibold hover:bg-surface-2"
              >
                <ReceiptIcon weight="bold" className="h-4 w-4" />
                Ver todas las ventas
              </Link>
            </div>
          )}
        </div>
      </header>

      {justSaved && <SavedBanner profit={sale.profit} total={sale.total} state={ticketState(sale)} clientName={isWalkInClient(sale.clientId) ? undefined : sale.clientName} className="mt-4 lg:hidden" />}

      <div className="mt-5 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex justify-center bg-surface-2 px-3 py-6 sm:py-9">
          <TicketCard
            ref={ticketRef}
            sale={sale}
            businessName={businessName}
            businessLine={businessLine}
            className={justSaved ? "animate-in fade-in slide-in-from-bottom-3 duration-500" : ""}
          />
        </div>

        <aside className="hidden lg:block">
          {justSaved ? (
            <SavedBanner
              profit={sale.profit}
              total={sale.total}
              state={ticketState(sale)}
              clientName={isWalkInClient(sale.clientId) ? undefined : sale.clientName}
              large
            />
          ) : (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                {sale.clientName}
              </p>
              <p className="mt-1 text-[28px] font-black leading-none">Te dejó {formatMXN(sale.profit)}</p>
              <p className="mt-1 text-[14px] text-text-muted">de ganancia bruta</p>
            </div>
          )}
          <div className="mt-6 space-y-2.5">
            {whatsappButton}
            <button
              type="button"
              onClick={saveImage}
              disabled={Boolean(busy)}
              className={buttonClass({ variant: "secondary", size: "lg", block: true })}
            >
              <DownloadSimpleIcon weight="bold" className="h-5 w-5" />
              Descargar imagen
            </button>
            <button
              type="button"
              onClick={copyText}
              className={buttonClass({ variant: "secondary", size: "lg", block: true })}
            >
              <CopyIcon weight="bold" className="h-5 w-5" />
              Copiar texto
            </button>
          </div>
          <button
            type="button"
            onClick={anotherSale}
            className={buttonClass({ variant: "primary", size: "lg", block: true, className: "mt-8" })}
          >
            <PlusIcon weight="bold" className="h-5 w-5" />
            Otra venta
          </button>
          <FeedbackLine feedback={feedback} />
        </aside>
      </div>

      {/* Móvil: acciones fijas abajo */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <div className="mx-auto max-w-[560px] space-y-2">
          {whatsappButton}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={saveImage}
              disabled={Boolean(busy)}
              className={buttonClass({ variant: "secondary", size: "md", className: "h-12" })}
            >
              <DownloadSimpleIcon weight="bold" className="h-5 w-5" />
              Guardar imagen
            </button>
            <button
              type="button"
              onClick={anotherSale}
              className={buttonClass({ variant: "secondary", size: "md", className: "h-12" })}
            >
              <PlusIcon weight="bold" className="h-5 w-5" />
              Otra venta
            </button>
          </div>
          <FeedbackLine feedback={feedback} />
        </div>
      </div>
      <div className="h-48 lg:h-10" />
    </div>
  );
}

/** Momento "ajá": cuánto te dejó la venta, contando desde $0. */
function SavedBanner({
  profit,
  total,
  state,
  clientName,
  large,
  className,
}: {
  profit: number;
  total: number;
  state: ReturnType<typeof ticketState>;
  clientName?: string;
  large?: boolean;
  className?: string;
}) {
  const shown = useCountUp(profit, 900);
  const owes = state === "pending" || state === "consignment";
  const detail = owes
    ? `Te deben ${formatMXN(total)} · lo verás en Por cobrar`
    : state === "courtesy"
      ? "Cortesía · no se cobró"
      : `Cobraste ${formatMXN(total)}${clientName ? ` a ${clientName}` : ""}`;

  return (
    <div className={`relative ${className ?? ""}`}>
      <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">
        <span className="h-2.5 w-2.5 bg-cta animate-in fade-in slide-in-from-top-4 duration-500" aria-hidden="true" />
        Venta guardada
      </p>
      <p className={`mt-1.5 font-black leading-none tracking-[-0.02em] ${large ? "text-[34px]" : "text-[26px]"}`}>
        Te dejó <span className="text-accent-text tabular-nums">{formatMXN(Math.round(shown))}</span>
      </p>
      <p className="mt-1.5 text-[14px] text-text-muted">{detail}</p>
    </div>
  );
}

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  const text =
    feedback === "shared"
      ? "Ticket enviado"
      : feedback === "downloaded"
        ? "Imagen guardada"
        : feedback === "copied"
          ? "Texto copiado"
          : "";
  return (
    <p aria-live="polite" className="min-h-5 text-center text-[13px] font-semibold text-success">
      {text && (
        <span className="inline-flex items-center gap-1.5 animate-in fade-in duration-200">
          <CheckIcon weight="bold" className="h-4 w-4" />
          {text}
        </span>
      )}
    </p>
  );
}
