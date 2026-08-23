import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Flame,
  Gem,
  HeartHandshake,
  Layers,
  Menu,
  MessageCircle,
  Package,
  Plus,
  Receipt,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
  Truck,
  Users,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/core/auth/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Artisan — Punto de venta y control para creadores y marcas artesanales",
      },
      {
        name: "description",
        content:
          "El sistema de punto de venta, inventario, precios de distribuidor y ganancia neta diseñado para talleres, marcas artesanales, velas, joyería, miel y alimentos de autor.",
      },
    ],
  }),
  component: LandingPage,
});

const creatorCategories = [
  {
    icon: Flame,
    title: "Velas & Cuidado Botánico",
    desc: "Velas de soja, difusores, jabones artesanales, cosmética natural y bálsamos.",
    tag: "Aromaterapia & Bienestar",
  },
  {
    icon: Gem,
    title: "Joyería & Bisutería de Autor",
    desc: "Plata 925, piedras naturales, aretes, collares, marroquinería y piezas únicas.",
    tag: "Accesorios & Moda",
  },
  {
    icon: Sparkles,
    title: "Miel, Salsas & Conservas",
    desc: "Miel pura, salsas machas, mermeladas, conservas gourmet y especias de autor.",
    tag: "Gourmet & Especialidad",
  },
  {
    icon: UtensilsCrossed,
    title: "Panadería & Café de Especialidad",
    desc: "Pan de masa madre, repostería, café tostado, kombuchas y bebidas locales.",
    tag: "Alimentos Artesanales",
  },
  {
    icon: Layers,
    title: "Cerámica, Diseño & Hogar",
    desc: "Piezas de barro, papelería artesanal, textiles teñidos y objetos decorativos.",
    tag: "Decoración & Arte",
  },
];

const pillars = [
  {
    icon: Tag,
    badge: "Control de precios",
    title: "Doble precio automático: Mostrador vs. Tiendas (PDV)",
    description:
      "Vende directo en bazares a precio público y entrega a boutiques o cafeterías a precio mayoreo. Artisan ajusta el precio en 1 segundo según el tipo de cliente.",
    highlight: "Cero confusiones al cobrar o facturar",
  },
  {
    icon: TrendingUp,
    badge: "Finanzas reales",
    title: "Margen neto exacto tras insumos y producción",
    description:
      "Registra cuánto te cuesta fabricar cada pieza. Sabrás al instante cuánto dinero cobraste y cuál es tu ganancia neta real del día.",
    highlight: "Conoce tu utilidad sin ser contador",
  },
  {
    icon: Truck,
    badge: "Consignaciones y crédito",
    title: "Cuentas claras en mercancía entregada y saldos pendientes",
    description:
      "¿Dejaste 10 piezas en una concept store para cobrar el próximo mes? Artisan lleva el saldo abierto, registra cambios por merma y te recuerda qué tiendas te deben.",
    highlight: "Nunca más olvides qué mercancía está afuera",
  },
  {
    icon: MessageCircle,
    badge: "Comprobantes ágiles",
    title: "Tickets profesionales listos para enviar por WhatsApp",
    description:
      "Genera un comprobante limpio y detallado con un solo toque para compartir con tu cliente directo o con el encargado de la tienda receptora.",
    highlight: "Trato profesional y formal al instante",
  },
];

const dailyFlow = [
  {
    step: "01",
    icon: Package,
    title: "Organiza tu catálogo y costos",
    copy: "Carga tus productos con su costo de elaboración, precio al público y precio distribuidor.",
  },
  {
    step: "02",
    icon: Store,
    title: "Registra ventas en 3 toques",
    copy: "Elige el cliente, agrega las piezas vendidas y selecciona si fue efectivo, transferencia o consignación.",
  },
  {
    step: "03",
    icon: Send,
    title: "Envía el ticket al comprador",
    copy: "Comparte el comprobante por WhatsApp al cliente o encargado de tienda con el desglose exacto.",
  },
  {
    step: "04",
    icon: BarChart3,
    title: "Cierra el día con números claros",
    copy: "Revisa cuánto cobraste, qué tiendas tienen saldo pendiente y cuál fue tu margen de ganancia real.",
  },
];

const faqs = [
  {
    q: "¿Para qué tipo de negocios y productos fue creado Artisan?",
    a: "Artisan está diseñado para creadores y marcas con producción propia o catálogo artesanal: marcas de velas, joyería, miel, salsas, panadería, cosmética botánica, cerámica, tostadores de café y productos locales que venden directo al público y distribuyen a puntos de venta aliados.",
  },
  {
    q: "¿Cómo funciona la doble lista de precios (Público vs. Distribuidor)?",
    a: "Cada producto tiene configurado su costo base, su precio al público y su precio de distribuidor. Al registrar una venta, seleccionas si el cliente es una persona particular o un punto de venta (PDV), y Artisan aplica automáticamente la tarifa correcta.",
  },
  {
    q: "¿Puedo registrar ventas a consignación, crédito o cambios de producto?",
    a: "Sí. Artisan fue pensado exactamente para la vida real de los productores locales. Puedes marcar una venta como 'Consignación' o 'Pendiente', registrar devoluciones o cambios de piezas dañadas, y consultar en cualquier momento la lista de cobros por liquidar.",
  },
  {
    q: "¿Necesito descargar o instalar alguna aplicación?",
    a: "No. Artisan funciona directo desde el navegador web en cualquier dispositivo: celular iPhone/Android, tablet o computadora. Tus datos se sincronizan al instante para que puedas vender en el taller, en un bazar o desde la ruta de entrega.",
  },
  {
    q: "¿Puedo empezar gratis sin capturar todo mi inventario de golpe?",
    a: "Totalmente. Puedes iniciar registrando solo tus 3 o 4 productos más vendidos y tus clientes principales. Conforme tu ritmo lo pida, agregas más existencias, recetas de costo y puntos de venta.",
  },
];

function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const appLink = user ? "/app" : "/login";
  const appLabel = user ? "Abrir mi panel" : "Empezar gratis";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#faf8f4] text-[#1c2822] selection:bg-[#23684a] selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-[#1c2822]/8 bg-[#faf8f4]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2" aria-label="Ir al inicio de Artisan">
            <Logo variant="full" className="h-8 w-auto" />
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-[#48564e] md:flex">
            <a className="transition hover:text-[#23684a]" href="#solucion">
              Por qué Artisan
            </a>
            <a className="transition hover:text-[#23684a]" href="#herramientas">
              Herramientas
            </a>
            <a className="transition hover:text-[#23684a]" href="#categorias">
              Creadores
            </a>
            <a className="transition hover:text-[#23684a]" href="#flujo">
              Flujo diario
            </a>
            <a className="transition hover:text-[#23684a]" href="#preguntas">
              Preguntas
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {!user && (
              <Link
                to="/login"
                className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-bold text-[#23684a] transition hover:bg-black/5"
              >
                Iniciar sesión
              </Link>
            )}
            <Link
              to={appLink}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#23684a] px-5 text-sm font-bold text-white shadow-[0_12px_24px_-12px_rgba(35,104,74,0.6)] transition hover:bg-[#1a5038] focus:outline-none focus:ring-2 focus:ring-[#23684a] focus:ring-offset-2"
            >
              {appLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#1c2822]/10 bg-white text-[#1c2822] md:hidden"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-[#1c2822]/10 bg-[#faf8f4] px-4 py-5 md:hidden">
            <div className="grid gap-2 text-sm font-semibold text-[#48564e]">
              {[
                ["Por qué Artisan", "#solucion"],
                ["Herramientas", "#herramientas"],
                ["Creadores", "#categorias"],
                ["Flujo diario", "#flujo"],
                ["Preguntas", "#preguntas"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-2 hover:bg-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 pt-2 border-t border-[#1c2822]/8">
                {!user && (
                  <Link
                    to="/login"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#1c2822]/12 bg-white font-bold text-[#1c2822]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                )}
                <Link
                  to={appLink}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#23684a] font-bold text-white shadow-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {appLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-[#1c2822]/10 pt-10 pb-16 lg:pt-16 lg:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
              {/* Hero Left Content */}
              <div className="flex flex-col">

                <h1 className="mt-5 text-4xl font-black tracking-tight text-[#141f1a] sm:text-5xl lg:text-[58px] lg:leading-[1.08]">
                  Deja de perder ventas en una libreta.
                </h1>

                <p className="mt-5 text-lg leading-relaxed text-[#4a5850] sm:text-xl">
                  Registra ventas, consignaciones y entregas
                  en segundos y ve cuánto ganas de verdad.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    to={appLink}
                    className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-[#23684a] px-7 text-base font-bold text-white shadow-[0_16px_32px_-12px_rgba(35,104,74,0.75)] transition hover:bg-[#1a5038] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {appLabel}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <a
                    href="#herramientas"
                    className="inline-flex h-13 items-center justify-center rounded-xl border border-[#1c2822]/15 bg-white px-6 text-base font-bold text-[#1c2822] shadow-sm transition hover:bg-[#faf8f4] hover:border-[#1c2822]/25"
                  >
                    Ver cómo funciona
                  </a>
                </div>

                {/* Hero Trust Pills */}
                <div className="mt-8 grid grid-cols-2 gap-2.5 pt-6 border-t border-[#1c2822]/8 text-xs font-semibold text-[#48564e] sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 border border-[#1c2822]/6">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#23684a]" />
                    <span>Precio para tiendas y precio directo</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 border border-[#1c2822]/6">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#23684a]" />
                    <span>Sabe exactamente cuánto gana</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 border border-[#1c2822]/6">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#23684a]" />
                    <span>Control de consignaciones</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 border border-[#1c2822]/6">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#23684a]" />
                    <span>Tickets listos para WhatsApp</span>
                  </div>
                </div>
              </div>

              {/* Hero Right Visual Mockup (High Fidelity Mobile Phone Preview) */}
              <div className="relative">
                <HeroMobilePhonePreview />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: EL PROBLEMA REAL VS. ARTISAN */}
        <section id="solucion" className="bg-white py-20 sm:py-28 border-b border-[#1c2822]/8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#23684a]">
                La realidad de los creadores locales
              </span>
              <h2 className="mt-3 text-3xl font-black text-[#141f1a] sm:text-4xl sm:leading-tight">
                Vender en mostrador y entregar en tiendas no debería ser un caos de libretas.
              </h2>
              <p className="mt-4 text-base text-[#4a5850] sm:text-lg">
                Cuando creas productos con tus propias manos, tu tiempo debe estar en la producción y en tus clientes, no descifrando cuentas en servilletas o mensajes perdidos de WhatsApp.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:gap-8">
              {/* Chaos Card */}
              <div className="rounded-2xl border border-red-200/70 bg-gradient-to-b from-[#fffaf9] to-[#fff5f5] p-7 sm:p-9 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-red-600">
                    <X className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-red-950">El método tradicional</h3>
                    <p className="text-xs font-semibold text-red-700">Libretas, notas y cálculos al aire</p>
                  </div>
                </div>
                <ul className="mt-6 space-y-3.5 text-sm text-red-950/80">
                  <li className="flex items-start gap-3">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>Dejas producto a consignación en tiendas y luego nadie recuerda cuántas piezas quedaron ni cuánto deben.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>Vendes sin saber si cubriste el costo de las materias primas.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>Confundes los precios de mayoreo para boutiques con los precios de venta directa en bazares.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <span>Tickets hechos a mano con letra ilegible que provocan desacuerdos al momento de cobrar.</span>
                  </li>
                </ul>
              </div>

              {/* Artisan Solution Card */}
              <div className="rounded-2xl border border-[#23684a]/25 bg-gradient-to-b from-[#f3faf6] to-[#ebf7f1] p-7 sm:p-9 shadow-sm transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#23684a] text-white shadow-xs">
                    <Check className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[#141f1a]">Con Artisan en tu negocio</h3>
                    <p className="text-xs font-semibold text-[#23684a]">Claridad y control en 10 segundos</p>
                  </div>
                </div>
                <ul className="mt-6 space-y-3.5 text-sm text-[#2a3c32]">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#23684a]" />
                    <span><strong>Consignaciones bajo control:</strong> Registro instantáneo de mercancía en tienda, devoluciones y saldos por cobrar.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#23684a]" />
                    <span><strong>Margen neto calculado:</strong> Conoce tu ganancia real en cada ticket descontando costos de insumos.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#23684a]" />
                    <span><strong>Doble precio automático:</strong> Selecciona el cliente y Artisan aplica la tarifa correcta de inmediato.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#23684a]" />
                    <span><strong>Comprobantes a WhatsApp:</strong> Envía tickets limpios y formales con un solo clic.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: LOS 4 PILARES DE VALOR (BENTO GRID) */}
        <section id="herramientas" className="bg-[#faf8f4] py-20 sm:py-28 border-b border-[#1c2822]/8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#23684a]">
                Herramientas hechas para tu dinámica real
              </span>
              <h2 className="mt-3 text-3xl font-black text-[#141f1a] sm:text-4xl sm:leading-tight">
                Todo lo que necesitas para operar tu marca en un solo lugar.
              </h2>
              <p className="mt-4 text-base text-[#4a5850] sm:text-lg">
                Diseñado específicamente para artesanos y creadores que fabrican, distribuyen y cobran en distintos momentos.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#1c2822]/10 bg-white p-7 sm:p-9 shadow-sm transition hover:border-[#23684a]/30 hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#edf6f2] text-[#23684a] transition group-hover:bg-[#23684a] group-hover:text-white">
                        <pillar.icon className="h-6 w-6" />
                      </div>
                      <span className="rounded-full bg-[#faf8f4] px-3 py-1 text-xs font-bold text-[#48564e] border border-[#1c2822]/8">
                        {pillar.badge}
                      </span>
                    </div>
                    <h3 className="mt-6 text-xl font-black text-[#141f1a]">
                      {pillar.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#4a5850]">
                      {pillar.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center gap-2 pt-4 border-t border-[#1c2822]/6 text-xs font-bold text-[#23684a]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{pillar.highlight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: CATEGORÍAS DE CREADORES */}
        <section id="categorias" className="bg-[#18231e] py-20 sm:py-28 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#a7d9c1]">
                Versatilidad para cualquier taller o proyecto
              </span>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl sm:leading-tight">
                Creado para artesanos de diversos oficios.
              </h2>
              <p className="mt-4 text-base text-[#b9cdc3] sm:text-lg">
                Ya sea que fundas cera, trabajes metales, hornees o coseches miel, Artisan se adapta a la estructura de tu producto y a tu esquema de venta.
              </p>
            </div>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {creatorCategories.map((cat) => (
                <div
                  key={cat.title}
                  className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-sm transition hover:bg-white/[0.09] hover:border-white/20"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#a7d9c1]">
                        <cat.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-bold text-[#a7d9c1] uppercase tracking-wider">
                        {cat.tag}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-black text-white">{cat.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#c2d5cb]">{cat.desc}</p>
                  </div>
                </div>
              ))}
              <div className="flex flex-col justify-between rounded-2xl border border-dashed border-white/20 bg-white/[0.02] p-6">
                <div>
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-[#a7d9c1]">
                    <Plus className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-black text-white">¿Tu marca tiene otro producto?</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#c2d5cb]">
                    Si tienes costos de insumos, inventario y vendes a público o tiendas, Artisan encaja al 100% con tu negocio.
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    to={appLink}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#a7d9c1] hover:underline"
                  >
                    <span>Pruébalo con tu catálogo</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: FLUJO DIARIO */}
        <section id="flujo" className="bg-[#faf8f4] py-20 sm:py-28 border-b border-[#1c2822]/8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#23684a]">
                Sencillo y directo
              </span>
              <h2 className="mt-3 text-3xl font-black text-[#141f1a] sm:text-4xl sm:leading-tight">
                El flujo de un día de trabajo con Artisan.
              </h2>
              <p className="mt-4 text-base text-[#4a5850] sm:text-lg">
                Desde que preparas tu lote de producción hasta que cierras caja al final del día.
              </p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {dailyFlow.map((item) => (
                <div
                  key={item.title}
                  className="relative flex flex-col justify-between rounded-2xl border border-[#1c2822]/10 bg-white p-6 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-[#23684a]/30">{item.step}</span>
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#edf6f2] text-[#23684a]">
                        <item.icon className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <h3 className="mt-4 text-base font-black text-[#141f1a]">{item.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#4a5850]">{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION: PREGUNTAS FRECUENTES (FAQS) */}
        <section id="preguntas" className="bg-white py-20 sm:py-28 border-b border-[#1c2822]/8">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#23684a]">
                Dudas resueltas
              </span>
              <h2 className="mt-3 text-3xl font-black text-[#141f1a] sm:text-4xl">
                Preguntas frecuentes antes de empezar.
              </h2>
              <p className="mt-4 text-base text-[#4a5850]">
                Todo lo que necesitas saber para comenzar a ordenar tus ventas hoy mismo.
              </p>
            </div>

            <div className="mt-12 space-y-3.5">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="overflow-hidden rounded-xl border border-[#1c2822]/10 bg-[#faf8f4] transition"
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 p-5 text-left text-base font-black text-[#141f1a] cursor-pointer"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#23684a] transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#1c2822]/8 bg-white px-5 py-4 text-sm leading-relaxed text-[#4a5850]">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA FINAL BANNER */}
        <section className="bg-[#23684a] py-16 sm:py-20 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold text-[#e1f5ec]">
                <Zap className="h-3.5 w-3.5" />
                Listo en menos de 2 minutos
              </span>
              <h2 className="mt-4 text-3xl font-black sm:text-5xl max-w-3xl leading-tight">
                Empieza hoy a tener el control total de tu marca artesanal.
              </h2>
              <p className="mt-4 max-w-2xl text-base text-[#c2e4d4] sm:text-lg">
                Deja atrás los cuadernos y las dudas sobre tu ganancia real. Abre tu panel y registra tu siguiente venta en cuestión de segundos.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={appLink}
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-black text-[#23684a] shadow-lg transition hover:bg-[#faf8f4] hover:scale-105 active:scale-95"
                >
                  {appLabel}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#1c2822]/10 bg-[#141f1a] py-10 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-col gap-2">
            <Logo variant="full" className="h-7 w-auto brightness-0 invert" />
            <p className="text-xs text-[#a0b2a8]">
              El sistema de punto de venta y control diario para creadores independientes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-[#a0b2a8]">
            <Link to="/privacidad" className="hover:text-white transition">
              Privacidad
            </Link>
            <Link to="/terminos" className="hover:text-white transition">
              Términos
            </Link>
            <Link to="/cookies" className="hover:text-white transition">
              Cookies
            </Link>
            <span className="text-[#a0b2a8]/50">© {new Date().getFullYear()} Artisan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * HIGH-FIDELITY MOBILE PHONE PREVIEW COMPONENT
 * Exact reproduction of Artisan's clean, authentic mobile app interface inside a modern smartphone frame.
 */
function HeroMobilePhonePreview() {
  return (
    <div className="relative mx-auto flex justify-center py-4 lg:py-0">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[340px] rounded-full bg-gradient-to-tr from-[#23684a]/20 via-[#23684a]/5 to-amber-500/10 blur-3xl pointer-events-none" />

      {/* Floating Accent Badge 1: WhatsApp Ticket */}
      <div className="hidden xl:flex absolute -left-12 top-28 items-center gap-3 rounded-2xl border border-[#1c2822]/10 bg-white/95 p-3.5 shadow-[0_18px_38px_-12px_rgba(20,31,26,0.18)] backdrop-blur-md z-20 animate-bounce-subtle">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#25D366] text-white shadow-sm">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black text-[#141f1a]">Ticket a WhatsApp</p>
          <p className="text-[11px] font-semibold text-[#6f7f76]">Listo en 1 clic</p>
        </div>
      </div>

      {/* Floating Accent Badge 2: Double Pricing Pill */}
      <div className="hidden xl:flex absolute -right-10 bottom-36 items-center gap-3 rounded-2xl border border-[#23684a]/20 bg-[#edf6f2]/95 p-3.5 shadow-[0_18px_38px_-12px_rgba(35,104,74,0.22)] backdrop-blur-md z-20">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#23684a] text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black text-[#23684a]">Doble Precio Automático</p>
          <p className="text-[11px] font-bold text-[#357c5a]">Público vs. Mayoreo PDV</p>
        </div>
      </div>

      {/* Smartphone Outer Chassis Frame */}
      <div className="relative w-[340px] sm:w-[370px] rounded-[48px] border-[10px] border-[#18231e] bg-[#18231e] shadow-[0_32px_80px_-20px_rgba(20,31,26,0.35)] ring-1 ring-black/10 overflow-hidden z-10">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 h-4 w-28 rounded-full bg-black z-30 flex items-center justify-end px-2">
          <div className="h-2 w-2 rounded-full bg-[#1c2822]/60" />
        </div>

        {/* Mobile Screen Surface */}
        <div className="relative flex flex-col bg-[#f7f8fa] text-[#1e242b] min-h-[710px] font-sans select-none overflow-hidden pt-7 pb-4 px-4.5">
          {/* Mobile App Header */}
          <div className="flex items-center justify-between pt-1 pb-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl border border-[#e5e9eb] bg-white text-[#1e242b] shadow-xs">
              <Menu className="h-4.5 w-4.5 text-[#1e242b]" />
            </div>

            <Logo variant="full" className="h-6 w-auto" />

            <div className="grid h-9 w-9 place-items-center rounded-full bg-[#e3efe9] text-xs font-bold text-[#23684a] border border-[#23684a]/15">
              GA
            </div>
          </div>

          {/* User Greeting Section */}
          <div className="pt-2 pb-3">
            <p className="text-[12px] font-semibold text-[#8c95a1]">Domingo, 23 De Agosto</p>
            <h3 className="mt-0.5 text-[22px] font-extrabold tracking-tight text-[#1e242b] leading-tight">
              Buenos días, Gabriela Quezada
            </h3>
            <p className="mt-1 text-[12px] font-medium text-[#6f7a72]">
              Ventas, pendientes, inventario y margen del día.
            </p>
          </div>

          {/* Action Pills Row */}
          <div className="space-y-2 pb-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-[#e2e6e9] bg-white text-[12px] font-bold text-[#1e242b] shadow-xs">
                <span>Filtros</span>
                <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-[#23684a] text-[10px] font-bold text-white">
                  1
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#8c95a1]" />
              </div>

              <div className="flex h-10 items-center justify-center gap-1.5 rounded-2xl border border-[#e2e6e9] bg-white text-[12px] font-bold text-[#1e242b] shadow-xs">
                <Package className="h-3.5 w-3.5 text-[#1e242b]" />
                <span>Agregar inventario</span>
              </div>
            </div>

            <div className="flex h-11 w-full items-center justify-center gap-1.5 rounded-2xl bg-[#23684a] text-[13px] font-bold text-white shadow-[0_8px_18px_-6px_rgba(35,104,74,0.6)]">
              <Plus className="h-4 w-4" />
              <span>Nueva venta</span>
            </div>
          </div>

          {/* 2x2 Bento KPI Grid */}
          <div className="grid grid-cols-2 gap-2.5 pb-2.5">
            {/* KPI 1: Ventas cobradas */}
            <div className="rounded-2xl border border-[#e9edf0] bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#8c95a1]">Ventas cobradas</span>
                <div className="grid h-6 w-6 place-items-center rounded-full bg-[#e8f7f0] text-[11px] font-bold text-[#10b981]">
                  $
                </div>
              </div>
              <p className="mt-1 text-[20px] font-black text-[#1e242b]">$11,981</p>
              <p className="text-[10px] font-medium text-[#8c95a1]">101 cobradas</p>
            </div>

            {/* KPI 2: Costos totales */}
            <div className="rounded-2xl border border-[#e9edf0] bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#8c95a1]">Costos totales</span>
                <div className="grid h-6 w-6 place-items-center rounded-full bg-[#fde8e8] text-[11px] font-bold text-[#ef4444]">
                  $
                </div>
              </div>
              <p className="mt-1 text-[20px] font-black text-[#1e242b]">$4,184</p>
              <p className="text-[10px] font-medium text-[#8c95a1] truncate">entregados y cortesi...</p>
            </div>

            {/* KPI 3: Ganancia neta */}
            <div className="rounded-2xl border border-[#e9edf0] bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#8c95a1]">Ganancia neta</span>
                <div className="grid h-6 w-6 place-items-center rounded-full bg-[#e8f7f0] text-[#10b981]">
                  <TrendingUp className="h-3 w-3" />
                </div>
              </div>
              <p className="mt-1 text-[20px] font-black text-[#1e242b]">$7,797</p>
              <p className="text-[10px] font-bold text-[#10b981]">65% margen útil</p>
            </div>

            {/* KPI 4: Por cobrar */}
            <div className="rounded-2xl border border-[#e9edf0] bg-white p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#8c95a1]">Por cobrar</span>
                <div className="grid h-6 w-6 place-items-center rounded-full bg-[#fef3c7] text-[11px] font-bold text-[#d97706]">
                  $
                </div>
              </div>
              <p className="mt-1 text-[20px] font-black text-[#1e242b]">$707</p>
              <p className="text-[10px] font-medium text-[#d97706]">5 pendientes</p>
            </div>
          </div>

          {/* Top Producto Card */}
          <div className="rounded-2xl border border-[#e9edf0] bg-white p-3.5 shadow-xs mb-auto">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#8c95a1]">Top producto</span>
              <div className="grid h-6 w-6 place-items-center rounded-full bg-[#e0f2fe] text-[#0284c7]">
                <Package className="h-3 w-3" />
              </div>
            </div>
            <p className="mt-1 text-[17px] font-black text-[#1e242b]">Vela Soja & Lavanda</p>
            <p className="text-[11px] font-medium text-[#8c95a1]">179 piezas entregadas</p>
          </div>

          {/* Mobile Bottom Navigation Bar */}
          <div className="relative mt-3 -mx-4.5 -mb-4 bg-white border-t border-[#e9edf0] px-3 pt-2 pb-3">
            <div className="grid grid-cols-5 items-center text-center">
              {/* Inicio (Active) */}
              <div className="flex flex-col items-center">
                <div className="grid h-6 w-6 place-items-center text-[#23684a]">
                  <Store className="h-4.5 w-4.5" />
                </div>
                <span className="text-[10px] font-extrabold text-[#23684a]">Inicio</span>
                <span className="mt-0.5 h-1 w-1 rounded-full bg-[#23684a]" />
              </div>

              {/* Ventas */}
              <div className="flex flex-col items-center text-[#8c95a1]">
                <Receipt className="h-4.5 w-4.5" />
                <span className="text-[10px] font-medium mt-0.5">Ventas</span>
              </div>

              {/* Central Floating Plus Button */}
              <div className="flex justify-center -mt-5">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#23684a] text-white shadow-[0_6px_16px_-2px_rgba(35,104,74,0.75)] ring-4 ring-white">
                  <Plus className="h-5 w-5" />
                </div>
              </div>

              {/* Productos */}
              <div className="flex flex-col items-center text-[#8c95a1]">
                <Package className="h-4.5 w-4.5" />
                <span className="text-[10px] font-medium mt-0.5">Productos</span>
              </div>

              {/* Ajustes */}
              <div className="flex flex-col items-center text-[#8c95a1]">
                <Layers className="h-4.5 w-4.5" />
                <span className="text-[10px] font-medium mt-0.5">Ajustes</span>
              </div>
            </div>

            {/* Mobile Bottom Home Bar Indicator */}
            <div className="mx-auto mt-2 h-1 w-28 rounded-full bg-[#1e242b]/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
