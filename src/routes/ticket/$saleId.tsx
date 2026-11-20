import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  CaretLeftIcon,
  CheckIcon,
  CheckFatIcon,
  CopyIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  PlusIcon,
  ReceiptIcon,
  SpinnerGapIcon,
  WhatsappLogoIcon,
} from "@phosphor-icons/react";
import { toPng } from "html-to-image";
import { BUSINESS_NAME, formatMXN } from "@/lib/artisan-data";
import { useArtisan } from "@/lib/artisan-store";
import { DataLoadError, DataLoadSkeleton } from "@/components/artisan/DataLoadState";
import { useAuth } from "@/core/auth/auth-context";
import { buttonClass } from "@/components/ui/button-styles";
import { useCountUp } from "@/lib/use-count-up";
import { TicketCard } from "@/components/sales/TicketCard";
import { savedMoment, shortFolio, ticketMessage, type SavedMoment } from "@/lib/ticket-format";

export const Route = createFileRoute("/ticket/$saleId")({
  head: () => ({ meta: [{ title: "Ticket — Grofit" }] }),
  component: Ticket,
});

type Feedback = "shared" | "downloaded" | "copied" | null;

function Ticket() {
  const { saleId } = Route.useParams();
  const { getSale, resetDraft, isLoading, loadError, lastSaleId, sales, allProducts } = useArtisan();
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
  // Celular: al guardar se muestra primero la pantalla "ajá"; "Ver ticket" la cierra.
  const [momentOpen, setMomentOpen] = useState(true);

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
  const missingCostIds = new Set(allProducts.filter((p) => p.needsCost).map((p) => p.id));
  const moment = justSaved ? savedMoment(sale, sales, new Date(), missingCostIds) : null;

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
          {moment ? (
            <SavedBanner moment={moment} />
          ) : (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                {sale.clientName}
              </p>
              {(() => {
                const m = savedMoment(sale, sales, new Date(), missingCostIds);
                return (
                  <>
                    <p className="mt-1 text-[28px] font-black leading-none">
                      {m.label === "Esta venta te dejó" ? "Te dejó" : m.label} {formatMXN(m.amount)}
                    </p>
                    <p className="mt-1 text-[14px] text-text-muted">
                      {m.missingCost && m.label === "Esta venta te dejó" ? "de lo que tiene costo" : "de ganancia bruta"}
                    </p>
                  </>
                );
              })()}
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

      {moment && momentOpen && (
        <MomentScreen
          moment={moment}
          busy={busy === "share"}
          onWhatsApp={sendWhatsApp}
          onSeeTicket={() => setMomentOpen(false)}
          onAnotherSale={anotherSale}
        />
      )}

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

/** Momento "ajá" en escritorio: panel junto al ticket. */
function SavedBanner({ moment }: { moment: SavedMoment }) {
  const shown = useCountUp(moment.amount, 900);
  return (
    <div>
      <p className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-text-muted">
        <span className="h-2.5 w-2.5 bg-cta animate-in fade-in slide-in-from-top-4 duration-500" aria-hidden="true" />
        {moment.eyebrow}
      </p>
      <p className="mt-1.5 text-[34px] font-black leading-none tracking-[-0.02em]">
        {moment.label === "Esta venta te dejó" ? "Te dejó" : moment.label}{" "}
        <span className="text-accent-text tabular-nums">{formatMXN(Math.round(shown))}</span>
      </p>
      <p className="mt-1.5 text-[14px] text-text-muted">{moment.detail}</p>
      {moment.missingCost ? <CostNudge /> : null}
    </div>
  );
}

/** Momento "ajá" en celular: pantalla completa oscura, el cuadro naranja "cae" y el número cuenta. */
function MomentScreen({
  moment,
  busy,
  onWhatsApp,
  onSeeTicket,
  onAnotherSale,
}: {
  moment: SavedMoment;
  busy: boolean;
  onWhatsApp: () => void;
  onSeeTicket: () => void;
  onAnotherSale: () => void;
}) {
  const shown = useCountUp(moment.amount, 1100);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="moment-title"
      className="fixed inset-0 z-50 flex flex-col bg-rail px-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))] text-rail-foreground animate-in fade-in duration-200 lg:hidden"
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-rail-muted">
        {moment.eyebrow}
      </p>
      <span
        className="mt-6 grid h-14 w-14 place-items-center bg-cta text-cta-foreground animate-in fade-in slide-in-from-top-16 duration-500 ease-out"
        aria-hidden="true"
      >
        <CheckFatIcon weight="bold" className="h-7 w-7" />
      </span>
      <h2 id="moment-title" className="mt-6 text-[36px] font-black leading-none tracking-[-0.02em]">
        Venta guardada.
      </h2>
      <p className="mt-4 text-[16px] text-rail-muted">{moment.label}</p>
      <p className="text-[64px] font-black leading-none tracking-[-0.03em] text-cta tabular-nums">
        {formatMXN(Math.round(shown))}
      </p>
      <p className="mt-3 text-[14px] text-rail-muted">{moment.detail}</p>
      {moment.missingCost ? <CostNudge dark /> : null}

      <div className="mt-auto space-y-2.5">
        <button
          type="button"
          onClick={onWhatsApp}
          disabled={busy}
          className={buttonClass({ variant: "cta", size: "lg", block: true })}
        >
          {busy ? (
            <SpinnerGapIcon weight="bold" className="h-5 w-5 animate-spin" />
          ) : (
            <WhatsappLogoIcon weight="fill" className="h-5 w-5" />
          )}
          {busy ? "Preparando..." : "Mandar ticket por WhatsApp"}
        </button>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onSeeTicket}
            className="h-12 rounded-md border border-rail-active text-[15px] font-bold transition hover:bg-rail-active"
          >
            Ver ticket
          </button>
          <button
            type="button"
            onClick={onAnotherSale}
            className="h-12 rounded-md border border-rail-active text-[15px] font-bold transition hover:bg-rail-active"
          >
            Otra venta
          </button>
        </div>
      </div>
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

/** Invitación a capturar el costo cuando algún producto vendido no lo tiene. */
function CostNudge({ dark }: { dark?: boolean }) {
  return (
    <Link
      to="/productos"
      className={`mt-5 flex items-center gap-3 rounded-md border px-3.5 py-3 text-[14px] leading-snug ${
        dark ? "border-rail-active text-rail-foreground" : "border-border text-text-primary"
      }`}
    >
      <span className="h-2.5 w-2.5 shrink-0 bg-cta" aria-hidden="true" />
      <span className="flex-1">Dime cuánto te cuesta cada producto y te digo cuánto te quedó.</span>
      <span className={`shrink-0 font-bold ${dark ? "text-cta" : "text-accent-text"}`}>Agregar costo</span>
    </Link>
  );
}
