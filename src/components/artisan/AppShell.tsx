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

// Móvil: Ajustes vive en el avatar del encabezado para dejar el "+" al centro.
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
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-background text-text-primary md:flex">
      {/* Riel oscuro (escritorio) */}
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-[88px] md:shrink-0 md:flex-col md:items-center md:gap-1.5 md:bg-rail md:py-4">
        <Link
          to="/app"
          aria-label="Artisan · Inicio"
          className="mb-3 grid h-10 w-10 place-items-center"
        >
          <Logo variant="icon" className="h-9 w-9" />
        </Link>

        <Link
          to="/nueva-venta"
          aria-label="Nueva venta"
          title="Nueva venta"
          className="group mb-3 grid h-13 w-13 place-items-center rounded-md bg-cta text-cta-foreground transition-[background-color,transform] duration-150 hover:bg-cta-hover active:scale-95"
        >
          <PlusIcon
            className="h-6 w-6 transition-transform duration-200 group-hover:rotate-90"
            weight="bold"
          />
        </Link>

        <nav aria-label="Navegación principal" className="flex flex-col items-center gap-1">
          {RAIL_ITEMS.map((item) => (
            <RailItem key={item.to} item={item} active={isActive(item.to)} />
          ))}
        </nav>

        <Link
          to="/ajustes"
          aria-label={`Cuenta de ${displayName}`}
          title={displayName}
          className="mt-auto grid h-10 w-10 place-items-center rounded-sm bg-rail-active text-[12px] font-bold text-rail-foreground transition hover:bg-rail-foreground hover:text-rail"
        >
          {initials}
        </Link>
      </aside>

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

        {/* Barra superior (escritorio) */}
        <header className="sticky top-0 z-30 hidden h-14 items-center gap-3 border-b border-border bg-surface px-6 md:flex lg:px-10">
          <span className="font-display text-[18px] font-black tracking-[-0.01em]">Artisan</span>
          <span className="text-border" aria-hidden>
            /
          </span>
          <span className="truncate text-[14px] font-semibold text-text-secondary">
            {businessName}
          </span>

          <form onSubmit={handleSearch} className="relative ml-auto w-full max-w-[380px]">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              id="header-global-search"
              aria-label="Buscar ventas, clientes o productos"
              placeholder="Buscar venta, cliente o producto"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-surface pl-9 pr-14 text-[14px] text-text-primary outline-none transition placeholder:text-text-muted focus:border-text-primary focus:ring-3 focus:ring-cta/25"
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
              <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm border border-border px-1.5 font-sans text-[11px] font-bold text-text-muted">
                ⌘K
              </kbd>
            )}
          </form>
        </header>

        <main className="w-full max-w-full flex-1 overflow-x-hidden pb-[calc(7rem+env(safe-area-inset-bottom))] md:px-6 md:pb-12 lg:px-10">
          <div className="w-full max-w-full">{children}</div>
        </main>

        {/* Barra móvil flotante */}
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
      </div>
    </div>
  );
}

function RailItem({ item, active }: { item: NavEntry; active: boolean }) {
  const ItemIcon = item.icon;
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={`flex h-[60px] w-16 flex-col items-center justify-center gap-1 rounded-md text-[11px] transition-colors duration-150 ${
        active
          ? "bg-rail-active font-bold text-rail-foreground"
          : "font-medium text-rail-muted hover:bg-rail-active/60 hover:text-rail-foreground"
      }`}
    >
      <span key={active ? "on" : "off"} className={active ? "animate-nav-pop" : undefined}>
        <ItemIcon className="h-[22px] w-[22px]" weight={active ? "fill" : "regular"} />
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
