import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  GearSixIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  PackageIcon,
  PlusIcon,
  ReceiptIcon,
  UsersIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { USER_NAME } from "@/lib/artisan-data";
import { useAuth } from "@/core/auth/auth-context";

type NavEntry = { to: string; label: string; icon: Icon };

const RAIL_ITEMS: NavEntry[] = [
  { to: "/app", label: "Inicio", icon: HouseIcon },
  { to: "/ventas", label: "Ventas", icon: ReceiptIcon },
  { to: "/clientes", label: "Clientes", icon: UsersIcon },
  { to: "/productos", label: "Productos", icon: PackageIcon },
  { to: "/ajustes", label: "Ajustes", icon: GearSixIcon },
];

// Ajustes vive en el avatar (escritorio y móvil); las pestañas son las 4 áreas de trabajo.
const TAB_ITEMS = RAIL_ITEMS.slice(0, 4);
// Móvil: el "+" queda al centro de la barra.
const MOBILE_LEFT = RAIL_ITEMS.slice(0, 2);
const MOBILE_RIGHT = RAIL_ITEMS.slice(2, 4);

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchQ = useRouterState({
    select: (s) =>
      s.location.pathname === "/buscar" ? (s.location.search as { q?: string }).q : "",
  });
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchQ ?? "");

  const isActive = (p: string) => {
    if (p === "/app") return pathname === "/app";
    return pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(`${p}_`);
  };
  // En el flujo de venta la barra estorba a los botones de abajo: se oculta.
  const hideMobileBar = pathname.startsWith("/nueva-venta") || pathname.startsWith("/ticket");
  const displayName = user?.user_metadata?.full_name ?? USER_NAME;
  const businessName = user?.user_metadata?.business_name ?? "Mi negocio";
  const initials = displayName.slice(0, 2).toUpperCase();

  // Cmd/Ctrl + K enfoca la búsqueda
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("header-global-search")?.focus();
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
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-background text-text-primary">
      <div className="relative flex min-h-screen w-full max-w-full flex-col overflow-x-hidden bg-background md:flex-1">
        {/* Encabezado móvil */}
        <header className="sticky top-0 z-30 flex h-14 w-full items-center gap-2 border-b border-border bg-surface pl-4 pr-2 md:hidden">
          <Link to="/app" className="flex min-w-0 items-center gap-2.5">
            <span className="h-3.5 w-3.5 shrink-0 bg-cta" aria-hidden />
            <span className="truncate font-display text-[18px] font-black tracking-[-0.01em]">
              {businessName}
            </span>
          </Link>
          <Link
            to="/buscar"
            search={{ q: "" }}
            aria-label="Buscar"
            className="ml-auto grid h-11 w-11 place-items-center rounded-md transition hover:bg-surface-2 active:scale-95"
          >
            <MagnifyingGlassIcon className="h-[22px] w-[22px]" />
          </Link>
          <Link
            to="/ajustes"
            aria-label="Ajustes y cuenta"
            className="grid h-11 w-11 place-items-center rounded-md active:scale-95"
          >
            <span className="grid h-8 w-8 place-items-center rounded-sm bg-primary text-[12px] font-bold text-primary-foreground">
              {initials}
            </span>
          </Link>
        </header>

        {/* Barra superior (escritorio y tablet): pestañas arriba, sin barra lateral */}
        <header className="sticky top-0 z-30 hidden h-16 items-center gap-2 border-b border-text-primary bg-surface px-6 md:flex lg:gap-4 lg:px-10">
          <Link to="/app" aria-label="Grofit · Inicio" className="mr-2 shrink-0 lg:mr-4">
            <Logo className="h-7 w-auto" />
          </Link>

          <nav aria-label="Navegación principal" className="flex h-full items-stretch">
            {TAB_ITEMS.map((item) => (
              <TopTab key={item.to} item={item} active={isActive(item.to)} />
            ))}
          </nav>

          <form
            onSubmit={handleSearch}
            className="relative ml-auto hidden w-full max-w-[300px] lg:block"
          >
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              id="header-global-search"
              aria-label="Buscar ventas, clientes o productos"
              placeholder="Buscar venta, cliente o producto"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 w-full rounded-md border border-transparent bg-surface-2 pl-9 pr-12 text-[14px] text-text-primary outline-none transition placeholder:text-text-muted focus:border-text-primary focus:bg-surface focus:ring-3 focus:ring-cta/25"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-sm text-text-muted transition hover:bg-muted hover:text-text-primary"
                aria-label="Limpiar búsqueda"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm border border-border bg-surface px-1.5 font-sans text-[11px] font-bold text-text-muted">
                ⌘K
              </kbd>
            )}
          </form>
          <Link
            to="/buscar"
            search={{ q: "" }}
            aria-label="Buscar"
            className="ml-auto grid h-10 w-10 place-items-center rounded-md transition hover:bg-surface-2 lg:hidden"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </Link>

          <Link
            to="/nueva-venta"
            aria-label="Nueva venta"
            className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-cta px-3 text-[14px] font-bold text-cta-foreground transition-[background-color,transform] duration-150 hover:bg-cta-hover active:scale-[0.97] lg:px-4"
          >
            <PlusIcon
              className="h-4.5 w-4.5 transition-transform duration-200 group-hover:rotate-90"
              weight="bold"
            />
            <span className="hidden lg:inline">Nueva venta</span>
          </Link>

          <Link
            to="/ajustes"
            aria-label={`Ajustes y cuenta de ${displayName}`}
            title={`${displayName} · ${businessName}`}
            className={`flex h-10 shrink-0 items-center gap-2 rounded-md border px-1 transition hover:border-text-primary lg:pr-3 ${
              isActive("/ajustes") ? "border-text-primary" : "border-border"
            }`}
          >
            <span className="grid h-8 w-8 place-items-center rounded-sm bg-primary text-[12px] font-bold text-primary-foreground">
              {initials}
            </span>
            <span className="hidden max-w-[140px] truncate text-[13px] font-semibold xl:inline">
              {businessName}
            </span>
          </Link>
        </header>

        <main className="w-full max-w-full flex-1 overflow-x-hidden pb-[calc(7rem+env(safe-area-inset-bottom))] md:px-6 md:pb-12 lg:px-10">
          <div className="w-full max-w-full">{children}</div>
        </main>

        {/* Barra móvil flotante */}
        {!hideMobileBar && (
          <nav
            aria-label="Navegación principal"
            className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-30 flex h-16 items-center rounded-lg bg-rail px-1.5 md:hidden"
          >
            {MOBILE_LEFT.map((item) => (
              <BarItem key={item.to} item={item} active={isActive(item.to)} />
            ))}
            <Link
              to="/nueva-venta"
              aria-label="Nueva venta"
              className="mx-1 grid h-12 w-14 shrink-0 place-items-center rounded-md bg-cta text-cta-foreground transition-transform duration-150 active:scale-90"
            >
              <PlusIcon className="h-6 w-6" weight="bold" />
            </Link>
            {MOBILE_RIGHT.map((item) => (
              <BarItem key={item.to} item={item} active={isActive(item.to)} />
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

function TopTab({ item, active }: { item: NavEntry; active: boolean }) {
  const ItemIcon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 px-3 text-[14px] transition-colors duration-150 lg:px-3.5 ${
        active
          ? "font-bold text-text-primary shadow-[inset_0_-3px_0_var(--text-primary)]"
          : "font-medium text-text-muted hover:text-text-primary hover:shadow-[inset_0_-3px_0_var(--border)]"
      }`}
    >
      <span
        key={active ? "on" : "off"}
        className={`hidden lg:inline ${active ? "animate-nav-pop" : ""}`}
      >
        <ItemIcon className="h-[18px] w-[18px]" weight={active ? "bold" : "regular"} />
      </span>
      {item.label}
    </Link>
  );
}

function BarItem({ item, active }: { item: NavEntry; active: boolean }) {
  const ItemIcon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={`flex h-full flex-1 flex-col items-center justify-center gap-0.5 text-[11px] transition-colors duration-150 active:scale-95 ${
        active ? "font-bold text-rail-foreground" : "font-medium text-rail-muted"
      }`}
    >
      <span key={active ? "on" : "off"} className={active ? "animate-nav-pop" : undefined}>
        <ItemIcon className="h-[22px] w-[22px]" weight={active ? "fill" : "regular"} />
      </span>
      {item.label}
    </Link>
  );
}
