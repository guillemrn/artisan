import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Plus,
  Settings,
  Users,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Menu,
  X,
  LogOut,
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

  const isActive = (p: string) => {
    if (p === "/app") return pathname === "/app";
    return pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}_`);
  };
  const displayName = user?.user_metadata?.full_name ?? USER_NAME;
  const initials = displayName.slice(0, 2).toUpperCase();

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Keyboard shortcut listener for search focus (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const searchEl = document.getElementById("header-global-search");
        if (searchEl) searchEl.focus();
      } else if (e.key === "Escape") {
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
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-background md:flex text-text-primary">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md animate-drawer-fade md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-[312px] max-w-[86vw] flex-col border-r border-border bg-white shadow-[0_24px_64px_-36px_rgba(15,23,42,0.55)] animate-drawer-in md:hidden">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-border bg-white p-4">
            <div className="flex items-center gap-2">
              <Logo variant="full" className="h-7 w-auto" />
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-white text-text-secondary transition hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Cerrar menú"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* User Profile Info Card inside Drawer */}
          <div className="border-b border-border bg-background/55 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-[13px] font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-primary">{displayName}</p>
                <p className="text-[11px] text-text-muted flex items-center gap-1.5 font-semibold mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-success" /> Sesion activa
                </p>
              </div>
            </div>

            <Link
              to="/nueva-venta"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-bold text-white transition hover:bg-[#1d573e] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva venta</span>
            </Link>
          </div>

          {/* Drawer Navigation items */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-2 text-[11px] font-bold text-text-muted">Navegacion</p>

            <DrawerItem
              to="/app"
              active={isActive("/app")}
              icon={<Home className="h-4.5 w-4.5" />}
              label="Inicio"
              onClick={() => setMobileMenuOpen(false)}
            />
            <DrawerItem
              to="/ventas"
              active={isActive("/ventas")}
              icon={<Receipt className="h-4.5 w-4.5" />}
              label="Ventas"
              onClick={() => setMobileMenuOpen(false)}
            />
            <DrawerItem
              to="/clientes"
              active={isActive("/clientes")}
              icon={<Users className="h-4.5 w-4.5" />}
              label="Clientes"
              onClick={() => setMobileMenuOpen(false)}
            />
            <DrawerItem
              to="/productos"
              active={isActive("/productos")}
              icon={<Package className="h-4.5 w-4.5" />}
              label="Productos"
              onClick={() => setMobileMenuOpen(false)}
            />
            <DrawerItem
              to="/ajustes"
              active={isActive("/ajustes")}
              icon={<Settings className="h-4.5 w-4.5" />}
              label="Ajustes"
              onClick={() => setMobileMenuOpen(false)}
            />
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-border bg-white p-4">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <Link
                to="/ajustes"
                onClick={() => setMobileMenuOpen(false)}
                className="font-semibold text-text-secondary transition hover:text-text-primary"
              >
                Ajustes
              </Link>
              {signOut && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-1.5 font-semibold text-danger transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
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
        className={`relative hidden md:sticky md:top-3 md:m-3 md:flex md:h-[calc(100vh-1.5rem)] md:shrink-0 md:flex-col md:rounded-2xl md:border md:border-border md:bg-white md:py-5 md:shadow-card transition-all duration-300 ease-in-out ${
          collapsed ? "md:w-[76px] md:px-2" : "md:w-[244px] md:px-3"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-text-secondary shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={collapsed ? "Expandir menu lateral" : "Contraer menu lateral"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>

        <div
          className={`flex h-10 items-center gap-2 rounded-xl ${collapsed ? "justify-center" : "px-2"}`}
        >
          <Logo
            variant={collapsed ? "icon" : "full"}
            className="h-7 w-auto transition-all duration-300"
          />
        </div>

        <Link
          to="/nueva-venta"
          className={`mt-6 flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary text-[13px] font-bold text-white transition-all duration-200 hover:bg-[#1d573e] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            collapsed ? "w-11 px-0" : "w-full px-4"
          }`}
          title={collapsed ? "Nueva venta" : undefined}
        >
          <Plus className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span className="truncate">Nueva venta</span>}
        </Link>

        <nav className="mt-5 flex flex-col gap-1.5" aria-label="Navegacion principal">
          <SideItem
            to="/app"
            active={isActive("/app")}
            icon={<Home className="h-4.5 w-4.5" />}
            label="Inicio"
            collapsed={collapsed}
          />
          <SideItem
            to="/ventas"
            active={isActive("/ventas")}
            icon={<Receipt className="h-4.5 w-4.5" />}
            label="Ventas"
            collapsed={collapsed}
          />
          <SideItem
            to="/clientes"
            active={isActive("/clientes")}
            icon={<Users className="h-4.5 w-4.5" />}
            label="Clientes"
            collapsed={collapsed}
          />
          <SideItem
            to="/productos"
            active={isActive("/productos")}
            icon={<Package className="h-4.5 w-4.5" />}
            label="Productos"
            collapsed={collapsed}
          />
          <SideItem
            to="/ajustes"
            active={isActive("/ajustes")}
            icon={<Settings className="h-4.5 w-4.5" />}
            label="Ajustes"
            collapsed={collapsed}
          />
        </nav>
      </aside>

      <div className="relative flex min-h-screen w-full max-w-full flex-col bg-background md:mx-0 md:max-w-none md:flex-1 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-black/[0.05] bg-white/90 px-4 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-white text-text-primary shadow-2xs transition hover:bg-muted active:scale-95 cursor-pointer"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="h-5 w-5 text-primary" />
            </button>
            <Link to="/app" className="flex items-center">
              <Logo variant="full" className="h-7 w-auto" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/ajustes"
              className="grid h-9 w-9 place-items-center rounded-xl bg-primary-light text-[12px] font-bold text-primary border border-primary/20"
              aria-label="Ajustes"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden h-16 items-center justify-between border-b border-black/[0.04] bg-white/70 px-6 backdrop-blur-md md:flex lg:px-10 sticky top-0 z-30">
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              id="header-global-search"
              aria-label="Buscar ventas, clientes o productos"
              placeholder="Buscar ventas, clientes o productos..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 w-full rounded-2xl border border-black/[0.06] bg-background/80 pl-10 pr-16 text-[13px] font-medium outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full text-text-muted hover:text-text-primary hover:bg-muted transition"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded-lg border border-black/[0.08] bg-white px-1.5 py-0.5 text-[10px] font-bold text-text-muted shadow-2xs">
                <span>⌘</span>
                <span>K</span>
              </div>
            )}
          </form>

          <div className="flex items-center gap-3">
            <Link
              to="/ajustes"
              className="flex items-center gap-2.5 rounded-2xl border border-black/[0.06] bg-white p-1.5 pr-3 shadow-2xs hover:border-primary/30 transition focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Perfil de usuario"
            >
              <div className="grid h-7 w-7 place-items-center rounded-xl bg-primary-light text-[12px] font-bold text-primary">
                {initials}
              </div>
              <span className="text-[13px] font-bold text-text-primary hidden sm:inline">
                {displayName}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 w-full max-w-full overflow-x-hidden pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-12 md:px-6 lg:px-10">
          <div className="w-full max-w-full">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-0 w-full border-t border-black/[0.06] bg-white/92 backdrop-blur-md md:hidden z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <div className="grid grid-cols-5 items-end px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <NavItem
              to="/app"
              active={isActive("/app")}
              icon={<Home className="h-5 w-5" />}
              label="Inicio"
            />
            <NavItem
              to="/ventas"
              active={isActive("/ventas")}
              icon={<Receipt className="h-5 w-5" />}
              label="Ventas"
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
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-xl py-2.5 text-[13.5px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? "bg-primary-light text-primary font-bold"
          : "text-text-secondary hover:bg-muted hover:text-text-primary"
      } ${collapsed ? "justify-center px-0 w-11 h-11 mx-auto" : "px-3.5"}`}
      title={collapsed ? label : undefined}
    >
      {active && !collapsed && (
        <span
          className="absolute left-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary"
          aria-hidden
        />
      )}
      <span
        className={`grid shrink-0 place-items-center ${!collapsed && active ? "ml-2" : ""}`}
        aria-hidden
      >
        {icon}
      </span>
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
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-[14px] font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? "bg-primary-light text-primary font-bold"
          : "text-text-secondary hover:bg-muted hover:text-text-primary"
      }`}
    >
      {active && (
        <span
          className="absolute left-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary"
          aria-hidden
        />
      )}
      <span className={`shrink-0 ${active ? "ml-2" : ""}`} aria-hidden>
        {icon}
      </span>
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
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-1 rounded-xl py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active ? "text-primary font-bold" : "text-text-muted hover:text-text-primary"
      }`}
    >
      {icon}
      <span>{label}</span>
      <span
        className={`h-1 w-1 rounded-full transition-all ${active ? "bg-primary scale-100" : "bg-transparent scale-0"}`}
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
        className="flex h-13 w-13 items-center justify-center rounded-full border-4 border-background bg-primary text-white shadow-[0_8px_20px_rgba(35,104,74,0.35)] active:scale-95 transition"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
