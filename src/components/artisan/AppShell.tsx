import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Plus,
  Settings,
  Users,
  Package,
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Menu,
  X,
  Activity,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { USER_NAME } from "@/lib/artisan-data";
import { useAuth } from "@/core/auth/auth-context";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchQ = useRouterState({
    select: (s) =>
      s.location.pathname === "/buscar" ? (s.location.search as { q?: string }).q : "",
  });
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchQ ?? "");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (p: string) => pathname === p;
  const displayName = user?.user_metadata?.full_name ?? USER_NAME;
  const initials = displayName.slice(0, 2).toUpperCase();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    navigate({ to: "/buscar", search: { q } });
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background md:flex">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-drawer-fade md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col bg-white shadow-2xl animate-drawer-in md:hidden border-r border-border">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/80 bg-background/50">
            <div className="flex items-center gap-2">
              <Logo variant="full" className="h-7 w-auto" />
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-white text-text-secondary hover:bg-muted active:scale-95 transition cursor-pointer"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile Info Card inside Drawer */}
          <div className="p-4 border-b border-border/60 bg-gradient-to-br from-primary-light/50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-[14px] font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-primary">{displayName}</p>
                <p className="text-[11px] text-text-muted flex items-center gap-1 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Sistema POS Activo
                </p>
              </div>
            </div>

            <Link
              to="/nueva-venta"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-bold text-white shadow-md transition hover:bg-[#246448] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva venta</span>
            </Link>
          </div>

          {/* Drawer Navigation items */}
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">Navegación general</p>

            <DrawerItem
              to="/"
              active={isActive("/")}
              icon={<Home className="h-5 w-5" />}
              label="Inicio"
              onClick={() => setMobileMenuOpen(false)}
            />
            <DrawerItem
              to="/ventas"
              active={isActive("/ventas")}
              icon={<Receipt className="h-5 w-5" />}
              label="Ventas"
              onClick={() => setMobileMenuOpen(false)}
            />
            <DrawerItem
              to="/clientes"
              active={isActive("/clientes")}
              icon={<Users className="h-5 w-5" />}
              label="Clientes"
              onClick={() => setMobileMenuOpen(false)}
            />
            <DrawerItem
              to="/productos"
              active={isActive("/productos")}
              icon={<Package className="h-5 w-5" />}
              label="Productos"
              onClick={() => setMobileMenuOpen(false)}
            />
            <DrawerItem
              to="/ajustes"
              active={isActive("/ajustes")}
              icon={<Settings className="h-5 w-5" />}
              label="Ajustes"
              onClick={() => setMobileMenuOpen(false)}
            />
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-border bg-background/40">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="flex items-center gap-1 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Artisan v1.2
              </span>
              {signOut && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-1.5 font-medium text-danger hover:underline cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Salir</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Floating Collapsible Sidebar for Desktop */}
      <aside
        className={`hidden md:sticky md:top-4 md:flex md:h-[calc(100vh-2rem)] md:shrink-0 md:flex-col md:rounded-2xl md:border md:border-border/80 md:bg-[#FBFCFA] md:shadow-md md:m-4 md:py-5 transition-all duration-300 ease-in-out relative ${
          collapsed ? "md:w-[84px] md:px-3" : "md:w-[260px] md:px-4"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-border bg-white shadow-sm flex items-center justify-center hover:bg-muted text-text-secondary cursor-pointer z-20"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <div className={`flex items-center gap-2 rounded-xl py-2 ${collapsed ? "justify-center" : "px-3"}`}>
          <Logo variant={collapsed ? "icon" : "full"} className="h-8 w-auto transition-all duration-300" />
        </div>

        <Link
          to="/nueva-venta"
          className={`mt-7 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(46,125,91,0.18)] transition-all duration-300 hover:bg-[#246448] overflow-hidden ${
            collapsed ? "w-11 px-0" : "w-full px-4"
          }`}
          title={collapsed ? "Nueva venta" : undefined}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">Nueva venta</span>}
        </Link>

        <nav className="mt-6 flex flex-col gap-1">
          <SideItem
            to="/"
            active={isActive("/")}
            icon={<Home className="h-4 w-4" />}
            label="Inicio"
            collapsed={collapsed}
          />
          <SideItem
            to="/ventas"
            active={isActive("/ventas")}
            icon={<Receipt className="h-4 w-4" />}
            label="Ventas"
            collapsed={collapsed}
          />
          <SideItem
            to="/clientes"
            active={isActive("/clientes")}
            icon={<Users className="h-4 w-4" />}
            label="Clientes"
            collapsed={collapsed}
          />
          <SideItem
            to="/productos"
            active={isActive("/productos")}
            icon={<Package className="h-4 w-4" />}
            label="Productos"
            collapsed={collapsed}
          />
          <SideItem
            to="/ajustes"
            active={isActive("/ajustes")}
            icon={<Settings className="h-4 w-4" />}
            label="Ajustes"
            collapsed={collapsed}
          />
        </nav>

        {!collapsed && (
          <div className="mt-auto rounded-xl border border-border bg-white p-4 transition-all duration-300">
            <p className="text-[12px] font-bold text-text-primary">Resumen operativo</p>
            <p className="mt-1 text-[12px] leading-relaxed text-text-muted">
              Ventas, clientes e inventario sincronizados para operar con claridad.
            </p>
          </div>
        )}
      </aside>

      <div className="relative flex min-h-screen w-full max-w-full flex-col bg-background md:mx-0 md:max-w-none md:flex-1 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/80 bg-white/90 px-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-white text-text-primary shadow-xs transition hover:bg-muted active:scale-95 cursor-pointer"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="h-5 w-5 text-primary" />
            </button>
            <Link to="/" className="flex items-center">
              <Logo variant="full" className="h-7 w-auto" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/ajustes"
              className="grid h-9 w-9 place-items-center rounded-xl bg-primary-light text-[12px] font-bold text-primary"
              aria-label="Ajustes"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden h-16 items-center justify-between border-b border-border/80 bg-white/72 px-6 backdrop-blur md:flex lg:px-10">
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              aria-label="Buscar"
              placeholder="Buscar ventas, clientes o productos"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-[13px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </form>
          <div className="flex items-center gap-2">
            <button
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-white text-text-secondary transition hover:bg-muted"
              aria-label="Notificaciones"
            >
              <Bell className="h-4 w-4" />
            </button>
            <Link
              to="/ajustes"
              className="grid h-10 w-10 place-items-center rounded-xl bg-primary-light text-[13px] font-bold text-primary"
              aria-label="Ajustes"
            >
              {initials}
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-10 md:px-6 lg:px-10 overflow-x-hidden max-w-full">
          <div className="md:mx-auto md:max-w-6xl">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-0 w-full border-t border-border bg-white/92 backdrop-blur md:hidden z-30">
          <div className="grid grid-cols-5 items-end px-2 pt-2 pb-3">
            <NavItem
              to="/"
              active={isActive("/")}
              icon={<Home className="h-5 w-5" />}
              label="Inicio"
            />
            <NavItem
              to="/clientes"
              active={isActive("/clientes")}
              icon={<Users className="h-5 w-5" />}
              label="Clientes"
            />
            <CenterNav />
            <NavItem
              to="/productos"
              active={isActive("/productos")}
              icon={<Package className="h-5 w-5" />}
              label="Productos"
            />
            <NavItem
              to="/ajustes"
              active={isActive("/ajustes")}
              icon={<Settings className="h-5 w-5" />}
              label="Ajustes"
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

function SideItem({
  to,
  active,
  icon,
  label,
  collapsed,
}: {
  to: string;
  active: boolean;
  icon: ReactNode;
  label: string;
  collapsed: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl py-2.5 text-[14px] font-semibold transition-all duration-300 ${
        active
          ? "bg-primary-light text-primary shadow-sm"
          : "text-text-secondary hover:bg-muted hover:text-text-primary"
      } ${collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : "px-3"}`}
      title={collapsed ? label : undefined}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function DrawerItem({
  to,
  active,
  icon,
  label,
  onClick,
}: {
  to: string;
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[14px] font-semibold transition-all duration-200 ${
        active
          ? "bg-primary-light text-primary shadow-sm font-bold"
          : "text-text-secondary hover:bg-muted hover:text-text-primary"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavItem({
  to,
  active,
  icon,
  label,
}: {
  to: string;
  active: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 py-1 text-[11px] font-semibold ${
        active ? "text-primary" : "text-text-muted"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`h-1 w-1 rounded-full ${active ? "bg-primary" : "bg-transparent"}`}
        aria-hidden
      />
    </Link>
  );
}

function CenterNav() {
  return (
    <div className="col-start-3 row-start-1 -mt-6 flex justify-center">
      <Link
        to="/nueva-venta"
        aria-label="Nueva venta"
        className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-background bg-primary text-white shadow-[0_10px_22px_rgba(13,74,62,0.28)]"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
