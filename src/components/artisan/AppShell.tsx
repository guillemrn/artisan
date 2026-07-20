import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Plus, Settings, Users, Package, Search, Bell } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { USER_NAME } from "@/lib/artisan-data";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchQ = useRouterState({
    select: (s) =>
      s.location.pathname === "/buscar" ? (s.location.search as { q?: string }).q : "",
  });
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchQ ?? "");
  const isActive = (p: string) => pathname === p;
  const initials = USER_NAME.slice(0, 2).toUpperCase();

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    navigate({ to: "/buscar", search: { q } });
  };

  return (
    <div className="min-h-screen w-full bg-background md:flex">
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-[272px] md:shrink-0 md:flex-col md:border-r md:border-border/80 md:bg-[#FBFCFA] md:px-4 md:py-5">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2">
          <Logo variant="full" className="h-8 w-auto" />
        </div>

        <Link
          to="/nueva-venta"
          className="mt-7 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary text-[14px] font-bold text-white shadow-[0_12px_24px_rgba(46,125,91,0.18)] transition hover:bg-[#246448]"
        >
          <Plus className="h-4 w-4" />
          Nueva venta
        </Link>

        <nav className="mt-6 flex flex-col gap-1">
          <SideItem
            to="/"
            active={isActive("/")}
            icon={<Home className="h-4 w-4" />}
            label="Inicio"
          />
          <SideItem
            to="/clientes"
            active={isActive("/clientes")}
            icon={<Users className="h-4 w-4" />}
            label="Clientes"
          />
          <SideItem
            to="/productos"
            active={isActive("/productos")}
            icon={<Package className="h-4 w-4" />}
            label="Productos"
          />
          <SideItem
            to="/ajustes"
            active={isActive("/ajustes")}
            icon={<Settings className="h-4 w-4" />}
            label="Ajustes"
          />
        </nav>

        <div className="mt-auto rounded-2xl border border-border bg-white p-4">
          <p className="text-[12px] font-bold text-text-primary">Resumen operativo</p>
          <p className="mt-1 text-[12px] leading-relaxed text-text-muted">
            Ventas, clientes e inventario sincronizados para operar con claridad.
          </p>
        </div>
      </aside>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background shadow-xl md:mx-0 md:max-w-none md:flex-1 md:shadow-none">
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

        <main className="flex-1 pb-24 md:pb-10 md:px-6 lg:px-10">
          <div className="md:mx-auto md:max-w-6xl">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-white/92 backdrop-blur md:hidden">
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
}: {
  to: string;
  active: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition ${
        active
          ? "bg-primary text-white shadow-sm"
          : "text-text-secondary hover:bg-muted hover:text-text-primary"
      }`}
    >
      {icon}
      <span>{label}</span>
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
