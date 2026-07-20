import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Store, User, Plus, Users, TrendingUp } from "lucide-react";
import { AddClientSheet } from "@/components/artisan/AddClientSheet";
import { useArtisan } from "@/lib/artisan-store";
import { formatMXN } from "@/lib/artisan-data";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Artisan" }] }),
  component: Clientes,
});

function Clientes() {
  const { clients, sales, addClient } = useArtisan();
  const [q, setQ] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Compute total sales and delivery counts per client
  const clientStats = useMemo(() => {
    const stats: Record<string, { totalAmount: number; count: number }> = {};
    sales.forEach((s) => {
      if (!stats[s.clientId]) {
        stats[s.clientId] = { totalAmount: 0, count: 0 };
      }
      stats[s.clientId].totalAmount += s.total;
      stats[s.clientId].count += 1;
    });
    return stats;
  }, [sales]);

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  const pdvCount = clients.filter((c) => c.channel === "PDV").length;
  const publicCount = clients.filter((c) => c.channel === "Público").length;

  return (
    <div className="page-shell md:px-0 md:pt-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wide text-primary">CRM</p>
          <h1 className="mt-1 text-[28px] font-bold leading-tight text-text-primary">Clientes</h1>
          <p className="mt-1 text-[14px] text-text-muted">
            Administra puntos de venta y compradores directos.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-[13px] font-bold text-white shadow-[0_10px_22px_rgba(46,125,91,0.18)] transition hover:bg-[#246448] sm:px-4"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo cliente</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1 text-text-muted">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Total</span>
          </div>
          <p className="text-[22px] font-bold leading-tight text-text-primary">{clients.length}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1 text-primary">
            <Store className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">PDV</span>
          </div>
          <p className="text-[22px] font-bold leading-tight text-primary">{pdvCount}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1 text-[#C9784A]">
            <User className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Directo</span>
          </div>
          <p className="text-[22px] font-bold leading-tight text-[#C9784A]">{publicCount}</p>
        </div>
      </div>

      <div className="mt-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre..."
          className="h-11 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-[14px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <ul className="mt-4 grid gap-3 pb-24 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c) => {
          const stats = clientStats[c.id] || { totalAmount: 0, count: 0 };
          return (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(31,43,46,0.08)]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                    c.channel === "PDV"
                      ? "bg-primary-light text-primary"
                      : "bg-[#FBF0E8] text-[#C9784A]"
                  }`}
                >
                  {c.channel === "PDV" ? (
                    <Store className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-text-primary">{c.name}</p>
                  <p className="text-[12px] text-text-muted truncate">Última: {c.lastDelivery}</p>
                </div>
              </div>

              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <span
                  className={`rounded-full text-[10px] font-semibold px-2 py-0.5 ${
                    c.channel === "PDV"
                      ? "bg-primary-light text-primary"
                      : "bg-[#FBF0E8] text-[#C9784A]"
                  }`}
                >
                  {c.channel}
                </span>
                {stats.count > 0 && (
                  <p className="text-[12px] font-bold text-primary flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" /> {formatMXN(stats.totalAmount)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <AddClientSheet
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSave={addClient}
        onCreated={() => {}}
      />
    </div>
  );
}
