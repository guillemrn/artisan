import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Store,
  Users,
  Package,
  CreditCard,
  Shield,
  LogOut,
  Bell,
  Info,
} from "lucide-react";
import { BUSINESS_NAME, USER_NAME } from "@/lib/artisan-data";
import { useArtisan } from "@/lib/artisan-store";
import { useAuth } from "@/core/auth/auth-context";
import { Logo } from "@/components/ui/logo";

export const Route = createFileRoute("/ajustes")({
  head: () => ({ meta: [{ title: "Ajustes — Artisan" }] }),
  component: Ajustes,
});

type SettingRow = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  to?: string;
  danger?: boolean;
  onPress?: () => void;
};

function Ajustes() {
  const { clients, products, sales } = useArtisan();
  const { user, signOut, isDemo } = useAuth();

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? USER_NAME;
  const displayEmail = user?.email ?? (isDemo ? "demo@artisan.app" : "");
  const initials = displayName.slice(0, 2).toUpperCase();

  const pendientesMonto = sales
    .filter((s) => s.status === "Pendiente")
    .reduce((acc, s) => acc + s.total, 0);

  const negocioRows: SettingRow[] = [
    {
      icon: <Store className="h-4 w-4" />,
      label: "Perfil del negocio",
      value: BUSINESS_NAME,
    },
    {
      icon: <Package className="h-4 w-4" />,
      label: "Productos y precios",
      value: `${products.length} productos`,
      to: "/productos",
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: "Clientes",
      value: `${clients.length} clientes`,
      to: "/clientes",
    },
  ];

  const appRows: SettingRow[] = [
    {
      icon: <CreditCard className="h-4 w-4" />,
      label: "Método de pago preferido",
      value: "Efectivo",
    },
    {
      icon: <Bell className="h-4 w-4" />,
      label: "Notificaciones",
      value: "Activadas",
    },
    {
      icon: <Shield className="h-4 w-4" />,
      label: "Respaldar datos",
    },
    {
      icon: <Info className="h-4 w-4" />,
      label: "Versión",
      value: "0.1.0 — MVP",
    },
  ];

  const accountRows: SettingRow[] = [
    {
      icon: <LogOut className="h-4 w-4" />,
      label: "Cerrar sesión",
      danger: true,
      onPress: signOut,
    },
  ];

  return (
    <div className="page-shell pb-10 md:px-0 md:pt-8">
      <div>
        <p className="text-[13px] font-bold uppercase tracking-wide text-primary">Configuración</p>
        <h1 className="mt-1 text-[28px] font-bold leading-tight text-text-primary">Ajustes</h1>
        <p className="mt-1 text-[14px] text-text-muted">
          Administra tu cuenta, negocio y preferencias operativas.
        </p>
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary text-lg font-bold text-white">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[16px] font-bold text-text-primary">{displayName}</p>
          <p className="truncate text-[13px] text-text-secondary">
            {displayEmail || BUSINESS_NAME}
          </p>
        </div>
        <Logo variant="icon" className="h-8 w-8 opacity-60 shrink-0" />
      </div>

      {pendientesMonto > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-warning/20 bg-warning/10 px-4 py-3">
          <div>
            <p className="text-[12px] font-bold text-warning">Cobros pendientes</p>
            <p className="text-[11px] text-warning/70">
              {sales.filter((s) => s.status === "Pendiente").length} ventas por cobrar
            </p>
          </div>
          <Link
            to="/"
            className="text-[12px] font-semibold text-warning underline underline-offset-2"
          >
            Ver ventas
          </Link>
        </div>
      )}

      <div className="md:grid md:grid-cols-2 md:gap-5">
        <div>
          <SectionLabel>Negocio</SectionLabel>
          <SettingsList rows={negocioRows} />
        </div>

        <div>
          <SectionLabel>Aplicación</SectionLabel>
          <SettingsList rows={appRows} />
        </div>
      </div>

      <SectionLabel>Cuenta</SectionLabel>
      <SettingsList rows={accountRows} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 mt-6 px-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">
      {children}
    </p>
  );
}

function SettingsList({ rows }: { rows: SettingRow[] }) {
  return (
    <ul className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {rows.map((r) => {
        const inner = (
          <div className="flex w-full items-center gap-3 border-b border-border/70 px-4 py-3.5 text-left last:border-b-0">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                r.danger ? "bg-red-50 text-danger" : "bg-primary-light text-primary"
              }`}
            >
              {r.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-[14px] font-semibold ${
                  r.danger ? "text-danger" : "text-text-primary"
                }`}
              >
                {r.label}
              </p>
              {r.value && <p className="text-[12px] text-text-muted truncate">{r.value}</p>}
            </div>
            <ChevronRight
              className={`h-4 w-4 ${r.danger ? "text-danger/50" : "text-text-muted"}`}
            />
          </div>
        );

        if (r.to) {
          return (
            <li key={r.label}>
              <Link to={r.to} className="block hover:bg-muted transition">
                {inner}
              </Link>
            </li>
          );
        }

        return (
          <li key={r.label}>
            <button className="w-full hover:bg-muted transition">{inner}</button>
          </li>
        );
      })}
    </ul>
  );
}
