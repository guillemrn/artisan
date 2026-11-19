import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  CaretDownIcon,
  CheckIcon,
  HandCoinsIcon,
  ShareNetworkIcon,
  ChartBarIcon,
} from "@phosphor-icons/react";
import { Logo } from "@/components/ui/logo";
import { buttonClass } from "@/components/ui/button-styles";
import { useAuth } from "@/core/auth/auth-context";
import { useReveal } from "@/lib/use-reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Artisan — Tus ventas, sin libreta" },
      {
        name: "description",
        content:
          "Registra ventas, cobra lo pendiente y manda tickets por WhatsApp desde tu celular. Para quien produce y vende: pan, salsas, velas, joyería, miel y más. Gratis.",
      },
    ],
  }),
  component: LandingPage,
});

const TRADES = [
  "Pan",
  "Salsas",
  "Velas",
  "Joyería",
  "Miel",
  "Cerámica",
  "Café",
  "Jabones",
  "Ropa",
  "Conservas",
  "Repostería",
  "Cosmética natural",
];

const FEATURES = [
  {
    icon: ChartBarIcon,
    title: "Sabe cuánto te queda.",
    copy: "Cobrado, costo y ganancia del día, sin hacer cuentas.",
    img: "/landing/dash-desktop.webp",
    alt: "Inicio de Artisan con la ganancia bruta del día y su desglose",
    w: 2704,
    h: 918,
    wide: true,
  },
  {
    icon: HandCoinsIcon,
    title: "Cobra lo que te deben.",
    copy: "Consignaciones y fiados en una lista, con un botón para cobrar.",
    img: "/landing/por-cobrar.webp",
    alt: "Lista de ventas por cobrar en Artisan con el total pendiente",
    w: 780,
    h: 704,
  },
  {
    icon: ShareNetworkIcon,
    title: "Ticket por WhatsApp.",
    copy: "Claro, con folio y forma de pago. Tu cliente lo recibe al instante.",
    img: "/landing/ticket.webp",
    alt: "Ticket de venta de Artisan listo para compartir",
    w: 648,
    h: 1170,
  },
];

const STEPS = ["Crea tu cuenta", "Registra tu primera venta", "Manda el ticket"];

const FAQS = [
  {
    q: "¿Cuánto cuesta?",
    a: "Empezar es gratis y no pedimos tarjeta.",
  },
  {
    q: "¿Tengo que capturar todo mi inventario?",
    a: "No. Empieza con tus productos más vendidos y agrega el resto cuando quieras.",
  },
  {
    q: "¿Hay que descargar algo?",
    a: "No. Funciona en el navegador del celular o la compu. Puedes agregarlo a tu pantalla de inicio.",
  },
  {
    q: "¿Sirve si dejo producto a consignación?",
    a: "Sí. La venta queda por cobrar hasta que te paguen, y ves qué tienda te debe y desde cuándo.",
  },
];

function LandingPage() {
  const { user } = useAuth();
  const ctaTo = user ? "/app" : "/login";
  const ctaSearch = user ? undefined : { modo: "registro" };
  const ctaLabel = user ? "Abrir mi panel" : "Crear mi cuenta gratis";
  useReveal();

  // Barra fija en móvil: aparece al pasar el hero y se esconde al llegar al cierre.
  const heroRef = useRef<HTMLElement | null>(null);
  const finalRef = useRef<HTMLElement | null>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const [finalVisible, setFinalVisible] = useState(false);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === heroRef.current) setHeroVisible(e.isIntersecting);
        if (e.target === finalRef.current) setFinalVisible(e.isIntersecting);
      });
    });
    if (heroRef.current) io.observe(heroRef.current);
    if (finalRef.current) io.observe(finalRef.current);
    return () => io.disconnect();
  }, []);
  const showStickyCta = !heroVisible && !finalVisible;

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-text-primary selection:bg-cta selection:text-cta-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" aria-label="Artisan, inicio" className="mr-auto">
            <Logo className="h-8 w-auto" />
          </Link>
          {!user && (
            <Link to="/login" className={buttonClass({ variant: "ghost", size: "sm" })}>
              Entrar
            </Link>
          )}
          <Link
            to={ctaTo}
            search={ctaSearch}
            className={buttonClass({ variant: "primary", size: "sm" })}
          >
            {user ? "Abrir panel" : "Crear cuenta"}
          </Link>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section ref={heroRef} className="border-b border-text-primary">
          <div className="mx-auto grid max-w-6xl items-end gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pt-16">
            <div className="lg:pb-24">
              <h1 className="landing-in font-display text-[52px] font-black leading-[0.9] tracking-[-0.04em] sm:text-[80px] lg:text-[96px]">
                Tus ventas,
                <br />
                <span className="relative inline-block">
                  sin libreta.
                  <span
                    aria-hidden
                    className="landing-underline absolute -bottom-1 left-0 h-2 w-full origin-left bg-cta sm:h-3"
                  />
                </span>
              </h1>
              <p className="landing-in landing-delay-1 mt-6 max-w-[440px] text-[18px] leading-snug text-text-secondary sm:text-[20px]">
                Registra, cobra y manda tickets por WhatsApp desde tu celular. Y ve cuánto te queda.
              </p>
              <div className="landing-in landing-delay-2 mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  to={ctaTo}
                  search={ctaSearch}
                  className={buttonClass({
                    variant: "cta",
                    size: "lg",
                    className: "group w-full sm:w-auto",
                  })}
                >
                  {ctaLabel}
                  <ArrowRightIcon
                    className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                    weight="bold"
                  />
                </Link>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-text-muted">
                  {["Sin tarjeta", "Listo en 1 minuto"].map((t) => (
                    <li key={t} className="flex items-center gap-1.5">
                      <CheckIcon className="h-4 w-4 text-success" weight="bold" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Producto real: celular + ticket */}
            <div className="relative mx-auto w-full max-w-[460px] lg:mr-0">
              <div className="landing-phone relative mx-auto w-[78%] max-w-[330px] overflow-hidden rounded-t-[34px] border-[9px] border-b-0 border-text-primary bg-surface">
                <img
                  src="/landing/dash-mobile.webp"
                  alt="Inicio de Artisan en el celular: ganancia bruta del día y lo que falta por cobrar"
                  width={780}
                  height={1688}
                  className="block h-auto w-full"
                  fetchPriority="high"
                />
              </div>
              <img
                src="/landing/ticket.webp"
                alt=""
                aria-hidden
                width={648}
                height={1170}
                className="landing-ticket absolute -right-1 bottom-10 w-[40%] max-w-[180px] border border-text-primary bg-surface sm:-right-6"
              />
            </div>
          </div>
        </section>

        {/* Para quién: marquesina */}
        <section
          aria-label="Para quién es Artisan"
          className="overflow-hidden bg-text-primary py-4"
        >
          <div className="landing-marquee flex w-max gap-10 whitespace-nowrap font-display text-[22px] font-bold text-primary-foreground sm:text-[26px]">
            {[...TRADES, ...TRADES].map((t, i) => (
              <span
                key={`${t}-${i}`}
                className="flex items-center gap-10"
                aria-hidden={i >= TRADES.length}
              >
                {t}
                <span className="h-2.5 w-2.5 bg-cta" aria-hidden />
              </span>
            ))}
          </div>
        </section>

        {/* Qué resuelve: imágenes reales */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6">
          {FEATURES.map((f, i) => {
            const FIcon = f.icon;
            return (
              <div
                key={f.title}
                data-reveal
                className={`grid items-center gap-8 border-b border-border py-14 sm:py-20 lg:gap-16 ${
                  f.wide ? "lg:grid-cols-[1fr_1.6fr]" : "lg:grid-cols-2"
                }`}
              >
                <div className={i === 1 ? "lg:order-2" : undefined}>
                  <FIcon className="h-8 w-8 text-cta" weight="fill" />
                  <h2 className="mt-4 font-display text-[36px] font-black leading-[0.95] tracking-[-0.03em] sm:text-[52px]">
                    {f.title}
                  </h2>
                  <p className="mt-3 max-w-[380px] text-[18px] text-text-secondary">{f.copy}</p>
                </div>
                <div
                  className={`landing-shot overflow-hidden rounded-lg border border-text-primary bg-surface ${
                    f.wide ? "" : "mx-auto w-full max-w-[380px]"
                  } ${i === 1 ? "lg:order-1" : ""}`}
                >
                  <img
                    src={f.img}
                    alt={f.alt}
                    width={f.w}
                    height={f.h}
                    loading="lazy"
                    className="block h-auto w-full"
                  />
                </div>
              </div>
            );
          })}
        </section>

        {/* Origen: lo hicimos para nuestro negocio */}
        <section data-reveal className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-6 border-t-2 border-text-primary pt-8 lg:grid-cols-[1fr_2fr]">
            <span className="h-8 w-8 bg-cta" aria-hidden />
            <div>
              <p className="font-display text-[26px] font-bold leading-tight tracking-[-0.01em] sm:text-[34px]">
                “Lo hicimos para nuestro propio negocio de pan: queríamos dejar la libreta y saber
                cuánto nos quedaba de verdad.”
              </p>
              <p className="mt-4 text-[15px] text-text-muted">
                Guillermo y Gaby · Almara Cocina Artesanal
              </p>
            </div>
          </div>
        </section>

        {/* Cómo empiezas */}
        <section data-reveal className="bg-surface-2">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <h2 className="font-display text-[30px] font-black tracking-[-0.02em] sm:text-[40px]">
              Empiezas en 1 minuto
            </h2>
            <ol className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-center gap-4 bg-surface p-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center bg-text-primary font-display text-[18px] font-black text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="text-[17px] font-semibold">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Preguntas */}
        <section
          data-reveal
          className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_2fr]"
        >
          <h2 className="font-display text-[30px] font-black tracking-[-0.02em] sm:text-[40px]">
            Preguntas
          </h2>
          <div className="border-t-2 border-text-primary">
            {FAQS.map((f) => (
              <details key={f.q} className="group border-b border-border">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <CaretDownIcon className="h-5 w-5 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="pb-5 text-[16px] text-text-secondary">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Cierre */}
        <section ref={finalRef} className="bg-text-primary text-primary-foreground">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="font-display text-[44px] font-black leading-[0.92] tracking-[-0.035em] sm:text-[72px]">
              Tu primera venta,
              <br />
              <span className="text-cta">en un minuto.</span>
            </h2>
            <Link
              to={ctaTo}
              search={ctaSearch}
              className={buttonClass({ variant: "cta", size: "lg", className: "group" })}
            >
              {ctaLabel}
              <ArrowRightIcon
                className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1"
                weight="bold"
              />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 pb-28 text-[13px] text-text-muted sm:px-6 sm:pb-6">
          <span>© {new Date().getFullYear()} Artisan</span>
          <Link to="/privacidad" className="hover:text-text-primary sm:ml-auto">
            Privacidad
          </Link>
          <Link to="/terminos" className="hover:text-text-primary">
            Términos
          </Link>
          <Link to="/cookies" className="hover:text-text-primary">
            Cookies
          </Link>
          <span>Imágenes con datos de ejemplo</span>
        </div>
      </footer>

      {/* CTA fija en móvil */}
      <div
        className={`fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 transition-[transform,opacity] duration-300 sm:hidden ${
          showStickyCta
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-24 opacity-0"
        }`}
        aria-hidden={!showStickyCta}
      >
        <Link
          to={ctaTo}
          search={ctaSearch}
          tabIndex={showStickyCta ? 0 : -1}
          className={buttonClass({ variant: "cta", size: "lg", block: true })}
        >
          {ctaLabel}
          <ArrowRightIcon className="h-5 w-5" weight="bold" />
        </Link>
      </div>
    </div>
  );
}
