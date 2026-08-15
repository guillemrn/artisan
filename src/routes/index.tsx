import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Menu,
  X,
  ArrowRight,
  Check,
  Sparkles,
  Smartphone,
  Receipt,
  Users,
  Package,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Instagram,
  Zap,
  Send,
  CheckCircle,
  Store,
  Clock,
  LayoutDashboard,
  Bell,
  TrendingUp,
  Plus,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/core/auth/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Artisan — Punto de Venta para Artesanos" }] }),
  component: LandingPage,
});


function LandingPage() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "¿Necesito instalar alguna app desde la App Store o Play Store?",
      a: "No. Artisan es una aplicación web de última generación. Funciona directo en el navegador de tu iPhone, Android, computadora o iPad sin ocupar espacio ni requerir descargas.",
    },
    {
      q: "¿Puedo usarlo en varios dispositivos al mismo tiempo?",
      a: "¡Sí! Toda tu información se sincroniza en tiempo real en la nube. Puedes registrar ventas desde tu celular en la calle y tu equipo en el taller verá los datos actualizados al instante.",
    },
    {
      q: "¿Cómo se envían los tickets a los clientes?",
      a: "Al finalizar una venta, Artisan genera un ticket profesional y con un botón esta listo para compartir por WhatsApp en 1 solo clic.",
    },
    {
      q: "¿Requiere tarjeta de crédito para comenzar?",
      a: "No. Puedes crear tu cuenta totalmente gratis hoy mismo y comenzar a organizar tu negocio sin ingresar datos de pago.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F5F4EF] text-[#2F3437] selection:bg-[#246448] selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Top Navbar */}
      <header className="bg-[#F5F4EF]/90 backdrop-blur-md sticky top-0 z-50 border-b border-black/5">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Logo variant="full" className="h-8 w-auto text-[#246448]" />

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/app"
                className="inline-flex items-center gap-2 rounded-xl bg-[#246448] px-4 py-2 text-[14px] font-bold text-white shadow-md hover:bg-[#1e533c] transition active:scale-95"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Abrir mi Panel</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#246448] px-4 py-2 text-[14px] font-bold text-white shadow-md hover:bg-[#1e533c] transition active:scale-95"
              >
                <span>Iniciar sesión</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section & Desktop/Mobile Showcase */}
      <section className="pt-8 pb-14 px-4 sm:px-6 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT COLUMN: Value Proposition (Cleaned & De-cluttered) */}
          <div className="lg:col-span-5 space-y-6 pt-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E8F1EC] px-3.5 py-1 text-[12px] font-bold text-[#246448] border border-[#246448]/20">
              <Users className="h-3.5 w-3.5" /> PARA PRODUCTORES Y EMPRENDEDORES
            </div>

            <h1 className="font-display text-[36px] sm:text-[46px] lg:text-[50px] font-extrabold leading-[1.1] tracking-tight text-[#1F2B2E]">
              Gestiona tu negocio artesanal desde <span className="text-[#246448]">un solo lugar.</span>
            </h1>

            <p className="text-[15px] sm:text-[16px] text-text-secondary leading-relaxed">
              Registra ventas en segundos, controla tu inventario y consulta tus ganancias reales con indicadores financieros en tiempo real.
            </p>

            {/* Clean & Simplified Feature Highlights (3 Key Points) */}
            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 border border-black/5">
                <div className="h-9 w-9 rounded-xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0 font-bold">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#1F2B2E]">Ventas y Tickets en Segundos</h4>
                  <p className="text-[12px] text-text-muted">Genera comprobantes de compra y envíalos directo a WhatsApp.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 border border-black/5">
                <div className="h-9 w-9 rounded-xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0 font-bold">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#1F2B2E]">KPIs y Margen Neto al Instante</h4>
                  <p className="text-[12px] text-text-muted">Visualiza tus ventas cobradas, ganancias reales y saldos por cobrar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/60 border border-black/5">
                <div className="h-9 w-9 rounded-xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0 font-bold">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#1F2B2E]">Inventario Sincronizado</h4>
                  <p className="text-[12px] text-text-muted">Descuento automático de existencias en tu computadora y celular.</p>
                </div>
              </div>
            </div>

            {/* CTA Button & Subtext */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#246448] px-7 text-[15px] font-bold text-white shadow-lg shadow-[#246448]/20 hover:bg-[#1c5039] transition active:scale-[0.98]"
              >
                Prueba Artisan gratis <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="text-[13px] text-text-muted italic leading-snug text-center sm:text-left">
                Sin tarjeta.<br />Sin complicaciones.
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Showcase (Mobile Dashboard on mobile screens, Desktop + Mobile on desktop screens) */}
          <div className="lg:col-span-7 relative pt-4 lg:pt-0">

            {/* MOBILE-ONLY PREVIEW (Shown on Mobile screens sm:hidden) */}
            <div className="block sm:hidden py-4">
              <div className="w-[300px] shadow-[0_20px_50px_rgba(0,0,0,0.18)] rounded-[38px] border-[7px] border-[#1F2B2E] bg-[#FAF9F5] overflow-hidden mx-auto">
                {/* Phone Notch */}
                <div className="bg-[#1F2B2E] h-5 w-full flex items-center justify-center">
                  <div className="w-16 h-3 bg-black rounded-full" />
                </div>

                {/* Mobile Content */}
                <div className="p-3.5 space-y-3 bg-[#FAF9F5]">
                  <div className="flex items-center justify-between">
                    <Logo variant="full" className="h-5 w-auto text-[#246448]" />
                    <Bell className="h-3.5 w-3.5 text-text-muted" />
                  </div>

                  <div>
                    <p className="text-[9px] text-text-muted font-semibold">Miércoles, 22 de Julio</p>
                    <h3 className="text-sm font-bold font-display text-[#1F2B2E]">¡Buenos días, Andrea!</h3>
                  </div>

                  {/* Mobile KPI 1 */}
                  <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs flex justify-between items-center">
                    <div>
                      <p className="text-[8px] font-bold text-text-muted uppercase">VENTAS HOY</p>
                      <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-0.5">$4,860.00</p>
                      <p className="text-[8px] text-text-muted">9 cobradas</p>
                    </div>
                    <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] flex items-center justify-center">
                      $
                    </div>
                  </div>

                  {/* Mobile KPI 2 */}
                  <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs flex justify-between items-center">
                    <div>
                      <p className="text-[8px] font-bold text-text-muted uppercase">GANANCIA</p>
                      <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-0.5">$2,940.00</p>
                      <p className="text-[8px] text-text-muted">60% margen util.</p>
                    </div>
                    <div className="h-6 w-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                      <TrendingUp className="h-3 w-3" />
                    </div>
                  </div>

                  {/* Mobile KPI 3 */}
                  <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs flex justify-between items-center">
                    <div>
                      <p className="text-[8px] font-bold text-text-muted uppercase">TOP PRODUCTO</p>
                      <p className="text-[11px] font-bold text-[#1F2B2E] mt-0.5">Jabón Lavanda</p>
                      <p className="text-[8px] text-text-muted">18 unidades vendidas</p>
                    </div>
                    <div className="h-6 w-6 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                      <Package className="h-3 w-3" />
                    </div>
                  </div>

                  {/* Mobile Action Button */}
                  <button className="w-full py-2 rounded-xl bg-[#246448] text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm">
                    <Plus className="h-3.5 w-3.5" /> Nueva venta
                  </button>

                  {/* Mobile Tab Bar */}
                  <div className="bg-white rounded-xl border border-black/5 py-1.5 px-3 flex justify-between items-center text-[8px] font-bold text-text-muted">
                    <div className="flex flex-col items-center text-[#246448]">
                      <Store className="h-3.5 w-3.5" />
                      <span>Inicio</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <Receipt className="h-3.5 w-3.5" />
                      <span>Ventas</span>
                    </div>
                    <div className="h-6 w-6 rounded-full bg-[#246448] text-white flex items-center justify-center shadow-2xs">
                      <Plus className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col items-center">
                      <Package className="h-3.5 w-3.5" />
                      <span>Productos</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Ajustes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DESKTOP APP MOCKUP (Shown on Tablet & Desktop screens sm:flex) */}
            <div className="hidden sm:flex bg-[#FAF9F5] rounded-[24px] border border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] overflow-hidden flex-col md:flex-row text-[#2F3437]">

              {/* Desktop Left Sidebar */}
              <div className="w-full md:w-48 bg-[#F4F3EE] p-4 border-r border-black/5 flex flex-col justify-between shrink-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <Logo variant="full" className="h-6 w-auto text-[#246448]" />
                  </div>

                  <button className="w-full h-9 rounded-xl bg-[#246448] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#1c5039] transition">
                    <Plus className="h-4 w-4" /> Nueva venta
                  </button>

                  <nav className="space-y-1 text-[12px] font-semibold">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#E8F4EE] text-[#246448] font-bold">
                      <Store className="h-4 w-4" /> Inicio
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-secondary hover:bg-black/5 transition">
                      <Receipt className="h-4 w-4" /> Ventas
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-secondary hover:bg-black/5 transition">
                      <Package className="h-4 w-4" /> Productos
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-secondary hover:bg-black/5 transition">
                      <Users className="h-4 w-4" /> Clientes
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-text-secondary hover:bg-black/5 transition">
                      <RefreshCw className="h-4 w-4" /> Ajustes
                    </div>
                  </nav>
                </div>

                <div className="space-y-3 pt-4 border-t border-black/5">
                  <div className="flex items-center gap-2 px-1">
                    <div className="h-7 w-7 rounded-full bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center shrink-0">
                      AM
                    </div>
                    <div className="truncate">
                      <p className="text-[11px] font-bold text-text-primary truncate">Andrea Moreno</p>
                      <p className="text-[9px] text-text-muted truncate">Emprendedora</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Main Dashboard Body */}
              <div className="flex-1 p-5 bg-[#FAF9F5] space-y-4">

                {/* Search & Header Bar */}
                <div className="flex items-center justify-between gap-4 border-b border-black/5 pb-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="h-3.5 w-3.5 text-text-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      readOnly
                      placeholder="Buscar ventas, clientes o productos"
                      className="w-full h-8 pl-8 pr-3 bg-white rounded-full border border-black/10 text-[11px] placeholder:text-text-muted focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white border border-black/10 flex items-center justify-center text-text-secondary">
                      <Bell className="h-3.5 w-3.5" />
                    </div>
                    <div className="h-8 px-2.5 rounded-full bg-white border border-black/10 flex items-center justify-center text-[11px] font-bold text-text-primary">
                      AM
                    </div>
                  </div>
                </div>

                {/* Dashboard Greeting */}
                <div>
                  <p className="text-[11px] text-text-muted font-semibold">Miércoles, 22 de Julio</p>
                  <h2 className="text-xl font-bold font-display text-[#1F2B2E]">¡Buenos días, Andrea!</h2>
                  <p className="text-[11px] text-text-muted">Este es el resumen de tu negocio hoy.</p>
                </div>

                {/* 4 Financial KPI Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Card 1 */}
                  <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">VENTAS COBRADAS</span>
                      <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] flex items-center justify-center">
                        $
                      </span>
                    </div>
                    <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-1.5">$4,860.00</p>
                    <p className="text-[9px] text-text-muted mt-0.5">9 cobradas</p>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">COSTOS TOTALES</span>
                      <span className="h-5 w-5 rounded-full bg-rose-50 text-rose-600 font-bold text-[10px] flex items-center justify-center">
                        $
                      </span>
                    </div>
                    <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-1.5">$1,920.00</p>
                    <p className="text-[9px] text-text-muted mt-0.5">entregados</p>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">GANANCIA NETA</span>
                      <span className="h-5 w-5 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                        <TrendingUp className="h-3 w-3" />
                      </span>
                    </div>
                    <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-1.5">$2,940.00</p>
                    <p className="text-[9px] text-text-muted mt-0.5">60% margen util.</p>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">POR COBRAR</span>
                      <span className="h-5 w-5 rounded-full bg-amber-50 text-amber-600 font-bold text-[10px] flex items-center justify-center">
                        $
                      </span>
                    </div>
                    <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-1.5">$860.00</p>
                    <p className="text-[9px] text-text-muted mt-0.5">2 pendientes</p>
                  </div>
                </div>

                {/* 3 Operational Metric Cards */}
                <div>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">MÉTRICAS DE OPERACIÓN</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-bold text-text-muted uppercase">TOP PRODUCTO</p>
                        <p className="text-[12px] font-bold text-[#1F2B2E] mt-0.5">Jabón Lavanda</p>
                        <p className="text-[9px] text-text-muted mt-0.5">18 unidades vendidas</p>
                      </div>
                      <div className="h-6 w-6 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                        <Package className="h-3.5 w-3.5" />
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
                      <p className="text-[9px] font-bold text-text-muted uppercase">PRODUCTOS ACTIVOS</p>
                      <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-0.5">36</p>
                      <p className="text-[9px] text-text-muted mt-0.5">en tu inventario</p>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs">
                      <p className="text-[9px] font-bold text-text-muted uppercase">CLIENTES ACTIVOS</p>
                      <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-0.5">22</p>
                      <p className="text-[9px] text-text-muted mt-0.5">este mes</p>
                    </div>
                  </div>
                </div>

                {/* Ventas recientes Table */}
                <div className="bg-white rounded-2xl border border-black/5 p-3.5 shadow-2xs">
                  <h4 className="text-[12px] font-bold text-[#1F2B2E] mb-2.5">Ventas recientes</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="text-text-muted border-b border-black/5 pb-1 font-semibold">
                          <th className="pb-1.5">Cliente</th>
                          <th className="pb-1.5">Producto</th>
                          <th className="pb-1.5">Cantidad</th>
                          <th className="pb-1.5">Total</th>
                          <th className="pb-1.5">Método</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        <tr>
                          <td className="py-2 font-bold text-[#1F2B2E]">Boutique Natural</td>
                          <td className="py-2 text-text-secondary">Jabón Lavanda</td>
                          <td className="py-2 text-text-secondary">6</td>
                          <td className="py-2 font-bold text-[#1F2B2E]">$720.00</td>
                          <td className="py-2">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Transferencia</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-[#1F2B2E]">Tienda Consciente</td>
                          <td className="py-2 text-text-secondary">Shampoo Sólido</td>
                          <td className="py-2 text-text-secondary">4</td>
                          <td className="py-2 font-bold text-[#1F2B2E]">$480.00</td>
                          <td className="py-2">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">Efectivo</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-[#1F2B2E]">Mercado Orgánico</td>
                          <td className="py-2 text-text-secondary">Vela de Soja</td>
                          <td className="py-2 text-text-secondary">5</td>
                          <td className="py-2 font-bold text-[#1F2B2E]">$650.00</td>
                          <td className="py-2">
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Transferencia</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-[#1F2B2E]">Cliente Directo</td>
                          <td className="py-2 text-text-secondary">Kit Facial</td>
                          <td className="py-2 text-text-secondary">2</td>
                          <td className="py-2 font-bold text-[#1F2B2E]">$390.00</td>
                          <td className="py-2">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">Efectivo</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

            {/* MOBILE OVERLAY FRAME (Shown overlapping desktop on Tablet & Desktop screens sm:block) */}
            <div className="absolute -bottom-10 -right-2 sm:right-2 w-[260px] sm:w-[280px] z-20 shadow-[0_25px_60px_rgba(0,0,0,0.22)] rounded-[38px] border-[7px] border-[#1F2B2E] bg-[#FAF9F5] overflow-hidden hidden sm:block">
              {/* Phone Notch */}
              <div className="bg-[#1F2B2E] h-5 w-full flex items-center justify-center">
                <div className="w-16 h-3 bg-black rounded-full" />
              </div>

              {/* Mobile Content */}
              <div className="p-3.5 space-y-3 bg-[#FAF9F5]">
                {/* Mobile Header */}
                <div className="flex items-center justify-between">
                  <Logo variant="full" className="h-5 w-auto text-[#246448]" />
                  <Bell className="h-3.5 w-3.5 text-text-muted" />
                </div>

                <div>
                  <p className="text-[9px] text-text-muted font-semibold">Miércoles, 22 de Julio</p>
                  <h3 className="text-sm font-bold font-display text-[#1F2B2E]">¡Buenos días, Andrea!</h3>
                </div>

                {/* Mobile KPI 1 */}
                <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-bold text-text-muted uppercase">VENTAS HOY</p>
                    <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-0.5">$4,860.00</p>
                    <p className="text-[8px] text-text-muted">9 cobradas</p>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] flex items-center justify-center">
                    $
                  </div>
                </div>

                {/* Mobile KPI 2 */}
                <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-bold text-text-muted uppercase">GANANCIA</p>
                    <p className="text-base font-extrabold font-display text-[#1F2B2E] mt-0.5">$2,940.00</p>
                    <p className="text-[8px] text-text-muted">60% margen util.</p>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                </div>

                {/* Mobile KPI 3 */}
                <div className="bg-white p-3 rounded-2xl border border-black/5 shadow-2xs flex justify-between items-center">
                  <div>
                    <p className="text-[8px] font-bold text-text-muted uppercase">TOP PRODUCTO</p>
                    <p className="text-[11px] font-bold text-[#1F2B2E] mt-0.5">Jabón Lavanda</p>
                    <p className="text-[8px] text-text-muted">18 unidades vendidas</p>
                  </div>
                  <div className="h-6 w-6 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                    <Package className="h-3 w-3" />
                  </div>
                </div>

                {/* Mobile Action Button */}
                <button className="w-full py-2 rounded-xl bg-[#246448] text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-sm">
                  <Plus className="h-3.5 w-3.5" /> Nueva venta
                </button>

                {/* Mobile Tab Bar */}
                <div className="bg-white rounded-xl border border-black/5 py-1.5 px-3 flex justify-between items-center text-[8px] font-bold text-text-muted">
                  <div className="flex flex-col items-center text-[#246448]">
                    <Store className="h-3.5 w-3.5" />
                    <span>Inicio</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <Receipt className="h-3.5 w-3.5" />
                    <span>Ventas</span>
                  </div>
                  <div className="h-6 w-6 rounded-full bg-[#246448] text-white flex items-center justify-center shadow-2xs">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col items-center">
                    <Package className="h-3.5 w-3.5" />
                    <span>Productos</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Ajustes</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM CATEGORIES BAR */}
        <div className="mt-16 bg-white rounded-3xl border border-black/5 p-6 shadow-xs text-center space-y-4">
          <p className="text-[13px] font-semibold text-text-muted">
            Creado para emprendedores que crean productos con sus manos y corazón.
          </p>

          <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-[12px] font-bold text-[#1F2B2E]">
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5">
              <span>🥖</span> Alimentos artesanales
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5">
              <span>🌶️</span> Chiles
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5">
              <span>🍓</span> Mermeladas
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5">
              <span>🕯️</span> Velas
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5">
              <span>🧼</span> Shampoos sólidos
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5">
              <span>🌿</span> Artesanías y accesorios
            </div>
            <div className="flex items-center gap-2 bg-[#FAF9F5] px-4 py-2 rounded-2xl border border-black/5 text-[#246448]">
              <span>➕</span> Y más
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION 1: Workflow / How It Works */}
      <section className="py-20 bg-white border-t border-black/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#246448] bg-[#E8F1EC] px-3.5 py-1 rounded-full border border-[#246448]/20">
              FLUJO ULTRA SIMPLE
            </span>
            <h2 className="font-display text-[30px] sm:text-[40px] font-extrabold text-[#1F2B2E]">
              Todo tu negocio organizado en 3 pasos
            </h2>
            <p className="text-[15px] text-text-muted">
              Sin configuraciones complejas. Comienza a registrar ventas desde el primer minuto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-[#FAF9F5] p-8 rounded-3xl border border-black/5 space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-[#246448] text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                1
              </div>
              <h3 className="text-lg font-bold font-display text-[#1F2B2E]">Carga tu Productos</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Ingresa tus precios de venta y costos de producción para calcular tu margen exacto automáticamente.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[#FAF9F5] p-8 rounded-3xl border border-black/5 space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-[#246448] text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="text-lg font-bold font-display text-[#1F2B2E]">Registra Ventas en Ruta</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Selecciona al cliente, añade los artículos y genera tickets listos para enviar por WhatsApp en 1 clic.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[#FAF9F5] p-8 rounded-3xl border border-black/5 space-y-4 relative">
              <div className="h-12 w-12 rounded-2xl bg-[#246448] text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="text-lg font-bold font-display text-[#1F2B2E]">Monitorea tus Ganancias</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Revisa tus ventas totales, ganancias netas y saldos por cobrar sin necesidad de hojas de cálculo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION 2: Complete Feature Grid */}
      <section className="py-20 bg-[#F5F4EF] border-t border-black/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#246448] bg-[#E8F1EC] px-3.5 py-1 rounded-full border border-[#246448]/20">
              HERRAMIENTAS ESPECIALIZADAS
            </span>
            <h2 className="font-display text-[30px] sm:text-[40px] font-extrabold text-[#1F2B2E]">
              Diseñado para la velocidad de tu día a día
            </h2>
            <p className="text-[15px] text-text-muted">
              Cada función está optimizada para ahorrarte tiempo en la cocina, taller o camino de reparto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-3 hover:border-[#246448]/30 transition">
              <div className="h-10 w-10 rounded-2xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1F2B2E] font-display">Registro en 3 Clics</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Interfaz táctil optimizada para registrar entregas en segundos con una sola mano desde tu celular.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-3 hover:border-[#246448]/30 transition">
              <div className="h-10 w-10 rounded-2xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0">
                <Send className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1F2B2E] font-display">Tickets de WhatsApp</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Envía comprobantes de compra limpios con el resumen de productos y total directo al cliente.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-3 hover:border-[#246448]/30 transition">
              <div className="h-10 w-10 rounded-2xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1F2B2E] font-display">Control de Saldos Fiados</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Mantén la cuenta clara de créditos y deudas de clientes pendientes para cobrar puntualmente.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-3 hover:border-[#246448]/30 transition">
              <div className="h-10 w-10 rounded-2xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1F2B2E] font-display">Margen Neto Automatizado</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Calcula automáticamente tus ingresos descontando tus costos para saber exactamente cuánto ganaste.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-xs space-y-3 hover:border-[#246448]/30 transition">
              <div className="h-10 w-10 rounded-2xl bg-[#E8F1EC] text-[#246448] flex items-center justify-center shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <h3 className="text-[16px] font-bold text-[#1F2B2E] font-display">Laptop & Celular Sincronizados</h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Usa tu computadora en el taller y tu teléfono en la calle. Tus datos siempre sincronizados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION 3: Social Proof / Testimonials */}
      <section className="py-20 bg-white border-t border-black/5">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#246448] bg-[#E8F1EC] px-3.5 py-1 rounded-full border border-[#246448]/20">
              HISTORIAS DE ÉXITO
            </span>
            <h2 className="font-display text-[30px] sm:text-[40px] font-extrabold text-[#1F2B2E]">
              Amado por productores independientes
            </h2>
            <p className="text-[15px] text-text-muted">
              Descubre cómo Artisan ayudó a ordenar las cuentas de pequeños emprendedores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FAF9F5] p-6 rounded-3xl border border-black/5 space-y-4">
              <div className="flex text-amber-400 gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed italic">
                "Antes tenia que tomar notas por whatsapp y cargarlos al final del dia en mi excel, ahora lo hago en tiempo real."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-9 w-9 rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center">
                  GQ
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#1F2B2E]">Gabriela Q.</h4>
                  <p className="text-[11px] text-text-muted">Almara Cocina</p>
                </div>
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* NEW SECTION 4: FAQ Accordion */}
      <section className="py-20 bg-[#F5F4EF] border-t border-black/5">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[#246448] bg-[#E8F1EC] px-3.5 py-1 rounded-full border border-[#246448]/20">
              DUDA DUDOSA
            </span>
            <h2 className="font-display text-[30px] sm:text-[36px] font-extrabold text-[#1F2B2E]">
              Preguntas Frecuentes
            </h2>
            <p className="text-[14px] text-text-muted">
              Todo lo que necesitas saber antes de empezar a usar Artisan.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-black/5 shadow-2xs overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left font-bold text-[15px] text-[#1F2B2E] flex justify-between items-center gap-4 hover:bg-[#FAF9F5] transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-text-muted transition-transform duration-200 shrink-0 ${openFaq === idx ? "rotate-180 text-[#246448]" : ""
                      }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-[13px] text-text-secondary leading-relaxed border-t border-black/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW SECTION 5: Final CTA Banner & Footer */}
      <section className="py-20 bg-[#246448] text-white text-center px-6 relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h2 className="font-display text-[32px] sm:text-[44px] font-extrabold leading-tight">
            Comienza a digitalizar tu negocio artesanal hoy mismo
          </h2>
          <p className="text-[16px] text-white/80 max-w-lg mx-auto leading-relaxed">
            Únete a los emprendedores que ya ahorran horas a la semana y tienen el control absoluto de sus ventas y ganancias.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-white px-8 text-[15px] font-bold text-[#246448] shadow-xl hover:bg-slate-100 transition active:scale-[0.98]"
            >
              Crear mi cuenta gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Comprehensive Footer */}
      <footer className="py-12 bg-[#EFECE6] border-t border-black/5 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <Logo variant="full" className="h-7 w-auto text-[#246448] mx-auto md:mx-0" />
            <p className="text-[12px] text-text-muted">
              © {new Date().getFullYear()} Artisan. La plataforma completa para productores y emprendedores artesanales.
            </p>
          </div>

          <div className="flex items-center gap-6 text-[13px] font-semibold text-text-secondary">
            <Link to="/login" className="hover:text-[#246448] transition">Iniciar Sesión</Link>
            <Link to="/login" className="hover:text-[#246448] transition">Registrarse</Link>
            <a
              href="https://instagram.com/guillermomrnl"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-[#246448] hover:underline"
            >
              <Instagram className="h-4 w-4" /> @guillermomrnl
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
