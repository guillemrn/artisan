import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Receipt,
  Send,
  Store,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/core/auth/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Artisan - Punto de venta y pedidos" }] }),
  component: LandingPage,
});

const operatingCards = [
  {
    icon: Receipt,
    title: "Venta rapida",
    copy: "Registra productos, cantidades, cliente, metodo de pago y ticket sin saltar entre libretas.",
  },
  {
    icon: Package,
    title: "Inventario vivo",
    copy: "Controla stock, costos, precios de distribuidor y precio al publico desde el mismo flujo.",
  },
  {
    icon: CreditCard,
    title: "Cobros pendientes",
    copy: "Distingue ventas cobradas, por cobrar, consignacion, cortesia y cambios sin perder contexto.",
  },
  {
    icon: BarChart3,
    title: "Margen claro",
    copy: "Ve ventas, costos y ganancia para saber que se movio y cuanto dejo cada dia.",
  },
];

const workflow = [
  {
    icon: Store,
    title: "Preparas la ruta",
    copy: "Consulta clientes, existencias y productos antes de salir a vender o entregar pedidos.",
  },
  {
    icon: Plus,
    title: "Registras la venta",
    copy: "Agregas articulos, cambios, metodo de pago y estado de entrega desde celular o computadora.",
  },
  {
    icon: Send,
    title: "Compartes el ticket",
    copy: "El comprobante queda listo para enviarse y la venta entra al historial del negocio.",
  },
  {
    icon: TrendingUp,
    title: "Cierras el dia",
    copy: "Revisas lo cobrado, lo pendiente, el stock y la ganancia sin rehacer cuentas.",
  },
];

const futureFits = [
  "Pedidos por cliente",
  "Citas o servicios programados",
  "Pagos parciales y pendientes",
  "Historial de clientes frecuentes",
];

const faqs = [
  {
    q: "¿Artisan es solo para alimentos?",
    a: "Hoy esta pensado sobre todo para negocios con productos e inventario, como panaderias o productores artesanales. La estructura tambien deja camino para crecer hacia servicios como belleza, unas, bienestar o trabajos por cita.",
  },
  {
    q: "¿Puedo vender a publico y a puntos de venta?",
    a: "Si. Artisan contempla ventas directas, clientes tipo punto de venta, precios distintos, pedidos, entregas, consignacion y saldos por cobrar.",
  },
  {
    q: "¿Necesito instalar una app?",
    a: "No. Funciona desde el navegador en celular, tablet o computadora, para que puedas abrirlo donde estes trabajando.",
  },
  {
    q: "¿Puedo empezar sin capturar todo mi negocio?",
    a: "Si. Puedes empezar con tus productos principales y ajustar inventario, clientes y precios conforme avances.",
  },
];

function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const appLink = user ? "/app" : "/login";
  const appLabel = user ? "Abrir mi panel" : "Empezar gratis";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f2ea] text-[#1d2723] selection:bg-[#245f44] selection:text-white">
      <header className="sticky top-0 z-50 border-b border-[#1d2723]/10 bg-[#f5f2ea]/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center" aria-label="Ir al inicio de Artisan">
            <Logo variant="full" className="h-8 w-auto" />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#405047] md:flex">
            <a className="transition hover:text-[#245f44]" href="#flujo">
              Flujo diario
            </a>
            <a className="transition hover:text-[#245f44]" href="#herramientas">
              Herramientas
            </a>
            <a className="transition hover:text-[#245f44]" href="#servicios">
              Servicios
            </a>
            <a className="transition hover:text-[#245f44]" href="#preguntas">
              Preguntas
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {!user && (
              <Link
                to="/login"
                className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-bold text-[#245f44] transition hover:bg-white/70"
              >
                Iniciar sesion
              </Link>
            )}
            <Link
              to={appLink}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#245f44] px-5 text-sm font-bold text-white shadow-[0_14px_28px_-18px_rgba(36,95,68,0.8)] transition hover:bg-[#1d4f38] focus:outline-none focus:ring-2 focus:ring-[#245f44] focus:ring-offset-2"
            >
              {appLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#1d2723]/12 bg-white/70 text-[#1d2723] md:hidden"
            aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#1d2723]/10 bg-[#f5f2ea] px-4 py-4 md:hidden">
            <div className="grid gap-2 text-sm font-semibold text-[#405047]">
              {[
                ["Flujo diario", "#flujo"],
                ["Herramientas", "#herramientas"],
                ["Servicios", "#servicios"],
                ["Preguntas", "#preguntas"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-2 hover:bg-white/70"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </a>
              ))}
              <Link
                to={appLink}
                className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#245f44] px-4 font-bold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {appLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="border-b border-[#1d2723]/10">
          <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8 lg:py-16">
            <div className="max-w-xl">
              <h1 className="max-w-[13ch] text-5xl font-black leading-[0.94] text-[#17231e] sm:text-6xl lg:text-7xl">
                Ventas, pedidos y cobros sin perder el hilo.
              </h1>

              <p className="mt-7 max-w-[64ch] text-base leading-8 text-[#405047] sm:text-lg">
                Artisan junta el punto de venta, la libreta de pedidos, los clientes y el inventario
                en un solo panel para negocios locales que venden directo, entregan a puntos de
                venta y cobran en distintos momentos.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={appLink}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#245f44] px-6 text-sm font-black text-white shadow-[0_18px_36px_-22px_rgba(36,95,68,0.9)] transition hover:bg-[#1d4f38] focus:outline-none focus:ring-2 focus:ring-[#245f44] focus:ring-offset-2"
                >
                  {appLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#flujo"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-[#1d2723]/14 bg-white/72 px-6 text-sm font-black text-[#1d2723] transition hover:bg-white"
                >
                  Ver como funciona
                </a>
              </div>

              <div className="mt-8 grid gap-2 rounded-lg border border-[#1d2723]/10 bg-white/72 p-2 text-sm font-semibold text-[#405047] sm:grid-cols-3">
                {["Venta directa", "Pedido abierto", "Cobro pendiente"].map((item) => (
                  <div key={item} className="flex min-h-10 items-center gap-2 rounded-md px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#245f44]" aria-hidden="true" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <ProductWorkbench />
          </div>
        </section>

        <section id="flujo" className="bg-[#fffaf0] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
              <div>
                <h2 className="max-w-xl text-4xl font-black leading-tight text-[#17231e] sm:text-5xl">
                  Del mostrador a la ruta, el flujo sigue siendo el mismo.
                </h2>
                <p className="mt-5 max-w-[60ch] text-base leading-8 text-[#536158]">
                  Artisan acompana el trabajo real de cada dia: vender, entregar, cobrar y revisar
                  que el inventario siga cuadrando.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {workflow.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-lg border border-[#1d2723]/10 bg-white p-5"
                  >
                    <item.icon className="h-5 w-5 text-[#245f44]" />
                    <h3 className="mt-5 text-xl font-black text-[#17231e]">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#536158]">{item.copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="herramientas"
          className="border-y border-[#1d2723]/10 bg-[#1d2723] py-20 text-white sm:py-24"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start">
              <div>
                <h2 className="max-w-xl text-4xl font-black leading-tight sm:text-5xl">
                  Herramientas para lo que pasa despues de vender.
                </h2>
                <p className="mt-5 max-w-[62ch] text-base leading-8 text-[#c4d2ca]">
                  Muchas ventas pequeñas se vuelven dificiles cuando aparecen pendientes, cambios,
                  consignacion y stock. Artisan mantiene esas realidades al frente.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {operatingCards.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-lg border border-white/12 bg-white/[0.06] p-5"
                  >
                    <item.icon className="h-5 w-5 text-[#f0a15f]" />
                    <h3 className="mt-5 text-lg font-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#c4d2ca]">{item.copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f5f2ea] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="rounded-lg bg-white p-4 shadow-[0_24px_60px_-42px_rgba(29,39,35,0.55)] sm:p-6">
                <div className="grid gap-3">
                  <div className="rounded-lg bg-[#f5f2ea] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-[#6a5c47]">Pedido para manana</p>
                        <h3 className="mt-1 text-2xl font-black text-[#17231e]">
                          12 piezas surtidas
                        </h3>
                      </div>
                      <CalendarClock className="h-8 w-8 text-[#245f44]" />
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-[#1d2723]/10 p-4">
                      <p className="text-xs font-bold text-[#536158]">Cliente</p>
                      <p className="mt-2 text-lg font-black text-[#17231e]">Punto de venta</p>
                    </div>
                    <div className="rounded-lg border border-[#1d2723]/10 p-4">
                      <p className="text-xs font-bold text-[#536158]">Estado</p>
                      <p className="mt-2 text-lg font-black text-[#b06b25]">Por cobrar</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#1d2723]/10 p-4">
                    <div className="mb-3 text-xs font-bold text-[#536158]">Detalle</div>
                    {["Pan pita familiar", "Salsa macha", "Chamoy artesanal"].map((item, index) => (
                      <div
                        key={item}
                        className="flex items-center justify-between border-t border-[#1d2723]/8 py-3 text-sm"
                      >
                        <span className="font-bold text-[#17231e]">{item}</span>
                        <span className="text-[#536158]">{index + 2} uds.</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="max-w-xl text-4xl font-black leading-tight text-[#17231e] sm:text-5xl">
                  No todo es venta inmediata. Artisan tambien guarda lo que queda abierto.
                </h2>
                <p className="mt-5 max-w-[62ch] text-base leading-8 text-[#536158]">
                  Pedidos, entregas, cambios, saldos y cortesias no se tratan como excepciones. Son
                  parte normal del negocio y deben verse claros.
                </p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    "Pedidos hechos por cliente",
                    "Ventas en consignacion",
                    "Cambios y devoluciones",
                    "Tickets para compartir",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-lg bg-white p-4 text-sm font-bold text-[#1d2723]"
                    >
                      <Check className="h-4 w-4 shrink-0 text-[#245f44]" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="servicios" className="bg-[#fffaf0] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
              <div>
                <h2 className="max-w-2xl text-4xl font-black leading-tight text-[#17231e] sm:text-5xl">
                  Hoy ordena productos. Manana puede crecer hacia servicios.
                </h2>
                <p className="mt-5 max-w-[66ch] text-base leading-8 text-[#536158]">
                  La base de Artisan sirve para negocios que necesitan saber quien pidio que, cuando
                  se entrega, cuanto falta cobrar y que historial tiene cada cliente. Esa misma
                  logica puede extenderse a emprendedores que venden citas o servicios.
                </p>
              </div>

              <div className="rounded-lg border border-[#1d2723]/10 bg-white p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-xl font-black text-[#17231e]">Camino preparado</h3>
                  <Clock className="h-5 w-5 text-[#245f44]" />
                </div>
                <div className="grid gap-3">
                  {futureFits.map((item) => (
                    <div
                      key={item}
                      className="flex items-center justify-between rounded-lg bg-[#f5f2ea] px-4 py-3 text-sm font-bold text-[#1d2723]"
                    >
                      <span>{item}</span>
                      <CheckCircle2 className="h-4 w-4 text-[#245f44]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="preguntas" className="bg-[#f5f2ea] py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
            <div>
              <h2 className="text-4xl font-black leading-tight text-[#17231e] sm:text-5xl">
                Preguntas antes de entrar.
              </h2>
              <p className="mt-5 max-w-[54ch] text-base leading-8 text-[#536158]">
                Respuestas cortas para decidir si Artisan encaja con tu forma de vender.
              </p>
            </div>
            <div className="grid gap-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={faq.q} className="rounded-lg border border-[#1d2723]/10 bg-white">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-base font-black text-[#17231e]"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#245f44] transition ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isOpen && (
                      <p className="px-5 pb-5 text-sm leading-7 text-[#536158]">{faq.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#245f44] px-4 py-16 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
                Empieza con la siguiente venta.
              </h2>
              <p className="mt-4 max-w-[62ch] text-base leading-8 text-[#d7e9de]">
                Abre Artisan, registra lo que vendiste y deja que inventario, clientes, cobros y
                ganancia queden conectados desde el primer dia.
              </p>
            </div>
            <Link
              to={appLink}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-black text-[#245f44] transition hover:bg-[#fffaf0] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#245f44]"
            >
              {appLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-[#17231e] px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#bfd0c7] sm:flex-row sm:items-center sm:justify-between">
          <Logo variant="full" className="h-7 w-auto brightness-0 invert" />
          <p>Artisan organiza ventas, pedidos, inventario y cobros para negocios locales.</p>
        </div>
      </footer>
    </div>
  );
}

function ProductWorkbench() {
  return (
    <div className="relative flex justify-center lg:justify-end">
      <div className="absolute left-4 top-10 hidden h-[500px] w-[420px] rounded-[48px] bg-[#23684a]/8 lg:block" />
      <div className="relative w-[320px] rounded-[42px] bg-[#18221e] p-2 shadow-[0_34px_90px_-44px_rgba(24,34,30,0.95)] sm:w-[350px]">
        <div className="overflow-hidden rounded-[34px] bg-[#f7f8fa]">
          <div className="flex h-7 items-center justify-center bg-[#18221e]">
            <div className="h-1.5 w-20 rounded-full bg-white/18" />
          </div>

          <div className="px-4 pb-4 pt-4">
            <div className="flex items-center justify-between">
              <Logo variant="full" className="h-7 w-auto" />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="grid h-9 w-9 place-items-center rounded-2xl border border-[#e9ecef] bg-white text-[#4a525d]"
                  aria-label="Notificaciones"
                >
                  <Bell className="h-4 w-4" />
                </button>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#f8d8a8] text-[12px] font-black text-[#7c4a16]">
                  AM
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[12px] font-semibold text-[#8c95a1]">miércoles, 22 de julio</p>
              <h3 className="mt-1 text-[23px] font-black leading-tight text-[#1e242b]">
                Buenas tardes, Andrea
              </h3>
            </div>

            <button
              type="button"
              className="mt-5 flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#23684a] text-[13px] font-black text-white"
            >
              <Plus className="h-4 w-4" />
              Nueva venta
            </button>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric title="Ventas hoy" value="$4,860" note="9 cobradas" color="text-[#23684a]" />
              <Metric title="Por cobrar" value="$860" note="2 pendientes" color="text-[#d97706]" />
              <Metric title="Ganancia" value="$2,940" note="60% margen" color="text-[#23684a]" />
              <Metric title="Productos" value="36" note="en inventario" color="text-[#1e242b]" />
            </div>

            <div className="mt-4 rounded-2xl bg-white p-4 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.5)]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[15px] font-black text-[#1e242b]">Ventas recientes</h3>
                <span className="text-[11px] font-bold text-[#8c95a1]">Hoy</span>
              </div>
              <div className="grid gap-2">
                {[
                  ["Cliente directo", "Efectivo", "$240"],
                  ["Punto de venta", "Pendiente", "$720"],
                  ["Pedido especial", "Transferencia", "$390"],
                ].map(([client, payment, total]) => (
                  <div
                    key={client}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl bg-[#f7f8fa] px-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-black text-[#1e242b]">{client}</p>
                      <p className="mt-1 text-[11px] font-semibold text-[#8c95a1]">{payment}</p>
                    </div>
                    <p className="text-[13px] font-black text-[#1e242b]">{total}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2 rounded-2xl border border-[#e9ecef] bg-white p-2 text-[10px] font-bold text-[#8c95a1]">
              {[
                [LayoutDashboard, "Inicio", true],
                [Receipt, "Ventas", false],
                [Plus, "", false],
                [Package, "Productos", false],
                [Users, "Clientes", false],
              ].map(([Icon, label, active]) => {
                const NavIcon = Icon as typeof LayoutDashboard;
                return (
                  <div
                    key={label as string}
                    className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl ${
                      active ? "bg-[#edf6f2] text-[#23684a]" : ""
                    }`}
                  >
                    <NavIcon className="h-4 w-4" />
                    {label ? <span>{label as string}</span> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  title,
  value,
  note,
  color,
}: {
  title: string;
  value: string;
  note: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[#1d2723]/10 bg-white p-4">
      <p className="text-xs font-bold text-[#6f7a72]">{title}</p>
      <p className={`mt-2 text-2xl font-black ${color}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#6f7a72]">{note}</p>
    </div>
  );
}
