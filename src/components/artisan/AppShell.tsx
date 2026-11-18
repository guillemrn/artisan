import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CaretLeftIcon,
  CaretRightIcon,
  GearSixIcon,
  HouseIcon,
  ListIcon,
  MagnifyingGlassIcon,
  PackageIcon,
  PlusIcon,
  ReceiptIcon,
  SignOutIcon,
  UsersIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
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
        <aside className="fixed inset-y-0 left-0 z-50 flex w-[312px] max-w-[86vw] flex-col border-r border-border bg-surface shadow-[0_24px_64px_-36px_rgba(17,17,17,0.55)] animate-drawer-in md:hidden">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <Logo variant="full" className="h-7 w-auto" />
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-md border border-border bg-surface text-text-secondary transition hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Cerrar menú"
            >
              <XIcon className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* User Profile Info Card inside Drawer */}
          <div className="border-b border-border bg-background/55 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-primary">{displayName}</p>
                <p className="text-[11px] text-text-muted flex items-center gap-1.5 font-semibold mt-0.5">
                  <span className="h-2 w-2 rounded-full bg-success" /> Sesión activa
                </p>
              </div>
            </div>

            <Link
              to="/nueva-venta"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cta text-[14px] font-bold text-cta-foreground transition hover:bg-cta-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <PlusIcon className="h-4 w-4" weight="bold" />
              <span>Nueva venta</span>
            </Link>
          </div>

          {/* Drawer Navigation items */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Navegación
            </p>

            <DrawerItem
              to="/app"
              active={isActive("/app")}
              icon={HouseIcon}
              label="Inicio"
              onClick={() => setMobileMenuOpen(false)}
            />
            <DrawerItem
              to="/ventas"
              active={isActive("/ventas")}
              icon={ReceiptIcon}
              label="Ventas"
              onClick={() => setMobileMenuOpen(false)}
            />
            <DrawerItem
              to="/clientes"
              active={isActive("/clientes")}
              icon={UsersIcon}
              label="Clientes"
              onClick={() => setMobileMenuOpen(false)}
            />
            <DrawerItem
              to="/productos"
              active={isActive("/productos")}
              icon={PackageIcon}
              label="Productos"
              onClick={() => setMobileMenuOpen(false)}
            />
            <DrawerItem
              to="/ajustes"
              active={isActive("/ajustes")}
              icon={GearSixIcon}
              label="Ajustes"
              onClick={() => setMobileMenuOpen(false)}
            />
          </div>

          {/* Drawer Footer */}
          <div className="border-t border-border bg-surface p-4">
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
                  <SignOutIcon className="h-3.5 w-3.5" />
                  <span>Salir</span>
                </button>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Floating Collapsible Sidebar for Desktop */}
      <aside
        className={`relative hidden md:sticky md:top-0 md:flex md:h-screen md:shrink-0 md:flex-col md:border-r md:border-border md:bg-surface md:py-5 transition-all duration-300 ease-in-out ${
          collapsed ? "md:w-[72px] md:items-center md:px-0" : "md:w-[244px] md:px-3"
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={collapsed ? "Expandir menu lateral" : "Contraer menu lateral"}
          aria-expanded={!collapsed}
        >
          {collapsed ? (
            <CaretRightIcon className="h-3.5 w-3.5" />
          ) : (
            <CaretLeftIcon className="h-3.5 w-3.5" />
          )}
        </button>

        <div
          className={`flex h-10 items-center gap-2 rounded-xl ${
            collapsed ? "w-11 justify-center" : "w-full px-2"
          }`}
        >
          <Logo
            variant={collapsed ? "icon" : "full"}
            className="h-7 w-auto transition-all duration-300"
          />
        </div>

        <Link
          to="/nueva-venta"
          className={`mt-6 flex h-11 items-center justify-center gap-2 overflow-hidden rounded-md bg-cta text-[14px] font-bold text-cta-foreground transition-all duration-200 hover:bg-cta-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            collapsed ? "w-11 px-0" : "w-full px-4"
          }`}
          title={collapsed ? "Nueva venta" : undefined}
        >
          <PlusIcon className="h-4.5 w-4.5 shrink-0" weight="bold" />
          {!collapsed && <span className="truncate">Nueva venta</span>}
        </Link>

        <nav
          className={`mt-5 flex flex-col gap-1.5 ${collapsed ? "w-full items-center" : "w-full"}`}
          aria-label="Navegacion principal"
        >
          <SideItem
            to="/app"
            active={isActive("/app")}
            icon={HouseIcon}
            label="Inicio"
            collapsed={collapsed}
          />
          <SideItem
            to="/ventas"
            active={isActive("/ventas")}
            icon={ReceiptIcon}
            label="Ventas"
            collapsed={collapsed}
          />
          <SideItem
            to="/clientes"
            active={isActive("/clientes")}
            icon={UsersIcon}
            label="Clientes"
            collapsed={collapsed}
          />
          <SideItem
            to="/productos"
            active={isActive("/productos")}
            icon={PackageIcon}
            label="Productos"
            collapsed={collapsed}
          />
          <SideItem
            to="/ajustes"
            active={isActive("/ajustes")}
            icon={GearSixIcon}
            label="Ajustes"
            collapsed={collapsed}
          />
        </nav>
      </aside>

      <div className="relative flex min-h-screen w-full max-w-full flex-col bg-background md:mx-0 md:max-w-none md:flex-1 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-surface px-4 md:hidden">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-md border border-border bg-surface text-text-primary transition hover:bg-muted active:scale-95 cursor-pointer"
              aria-label="Abrir menú de navegación"
            >
              <ListIcon className="h-5 w-5 text-text-primary" />
            </button>
            <Link to="/app" className="flex items-center">
              <Logo variant="full" className="h-7 w-auto" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/ajustes"
              className="grid h-9 w-9 place-items-center rounded-md bg-surface-2 text-[12px] font-bold text-text-primary border border-border"
              aria-label="Ajustes"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="sticky top-0 z-30 hidden h-15 items-center justify-between border-b border-border bg-background px-6 md:flex lg:px-10">
          <form onSubmit={handleSearch} className="relative w-full max-w-[420px]">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              id="header-global-search"
              aria-label="Buscar ventas, clientes o productos"
              placeholder="Buscar venta, cliente o producto"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-14 text-[13px] font-semibold text-text-primary outline-none transition placeholder:text-text-muted focus:border-text-primary focus:ring-3 focus:ring-cta/25"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg text-text-muted transition hover:bg-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Limpiar búsqueda"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-text-muted">
                <span>⌘</span>
                <span>K</span>
              </div>
            )}
          </form>

          <div className="flex items-center gap-2">
            <Link
              to="/ajustes"
              className="flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-2 pr-3 text-text-primary transition hover:border-text-primary hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Perfil de usuario"
            >
              <div className="grid h-7 w-7 place-items-center rounded-md bg-surface-2 text-[12px] font-bold text-text-primary">
                {initials}
              </div>
              <span className="hidden max-w-[180px] truncate text-[13px] font-bold sm:inline">
                {displayName}
              </span>
            </Link>
          </div>
        </header>

        <main className="flex-1 w-full max-w-full overflow-x-hidden pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-12 md:px-6 lg:px-10">
          <div className="w-full max-w-full">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-0 w-full border-t border-border bg-surface md:hidden z-30">
          <div className="grid grid-cols-5 items-end px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <NavItem to="/app" active={isActive("/app")} icon={HouseIcon} label="Inicio" />
            <NavItem to="/ventas" active={isActive("/ventas")} icon={ReceiptIcon} label="Ventas" />
            <CenterNav />
            <NavItem
              to="/productos"
              active={isActive("/productos")}
              icon={PackageIcon}
              label="Productos"
            />
            <NavItem
              to="/ajustes"
              active={isActive("/ajustes")}
              icon={GearSixIcon}
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
  icon: ItemIcon,
  label,
  collapsed,
}: {
  to: string;
  active: boolean;
  icon: Icon;
  label: string;
  collapsed: boolean;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-md py-2.5 text-[14px] font-medium transition-colors duration-150 ${
        active
          ? "bg-surface-2 font-bold text-text-primary shadow-[inset_3px_0_0_var(--text-primary)]"
          : "text-text-muted hover:bg-surface-2 hover:text-text-primary"
      } ${collapsed ? "h-11 w-11 justify-center px-0" : "px-3.5"}`}
      title={collapsed ? label : undefined}
    >
      <span className="grid shrink-0 place-items-center" aria-hidden>
        <ItemIcon className="h-5 w-5" weight={active ? "bold" : "regular"} />
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function DrawerItem({
  to,
  active,
  icon: ItemIcon,
  label,
  onClick,
}: {
  to: string;
  active: boolean;
  icon: Icon;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-3.5 rounded-md px-3.5 py-3 text-[15px] font-medium transition-colors duration-150 ${
        active
          ? "bg-surface-2 font-bold text-text-primary shadow-[inset_3px_0_0_var(--text-primary)]"
          : "text-text-muted hover:bg-surface-2 hover:text-text-primary"
      }`}
    >
      <span className="shrink-0" aria-hidden>
        <ItemIcon className="h-5 w-5" weight={active ? "bold" : "regular"} />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

function NavItem({
  to,
  active,
  icon: ItemIcon,
  label,
}: {
  to: string;
  active: boolean;
  icon: Icon;
  label: string;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-1 py-1.5 text-[11px] transition-colors ${
        active
          ? "font-bold text-text-primary shadow-[inset_0_2px_0_var(--text-primary)]"
          : "font-medium text-text-muted hover:text-text-primary"
      }`}
    >
      <ItemIcon className="h-6 w-6" weight={active ? "bold" : "regular"} />
      <span>{label}</span>
    </Link>
  );
}

function CenterNav() {
  return (
    <div className="col-start-3 row-start-1 -mt-6 flex justify-center">
      <Link
        to="/nueva-venta"
        aria-label="Nueva venta"
        className="flex h-13 w-13 items-center justify-center rounded-full border-4 border-background bg-cta text-cta-foreground shadow-fab active:scale-95 transition"
      >
        <PlusIcon className="h-6 w-6" weight="bold" />
      </Link>
    </div>
  );
}
