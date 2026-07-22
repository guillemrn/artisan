import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Activity, Receipt, CheckCircle2, Clock, Search } from "lucide-react";
import { formatMXN } from "@/lib/artisan-data";
import { useArtisan } from "@/lib/artisan-store";

export const Route = createFileRoute("/actividad")({
  head: () => ({ meta: [{ title: "Actividad — Artisan" }] }),
  component: Actividad,
});

type StatusFilter = "Todos" | "Entregado" | "Pendiente";

function Actividad() {
  const navigate = useNavigate();
  const { sales } = useArtisan();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todos");

  const recentEvents = useMemo(() => {
    // Generamos todos los eventos primero
    const allEvents = sales.map((s) => ({
      id: `evt-${s.id}`,
      type: "SALE_REGISTERED",
      title: `Venta a ${s.clientName}`,
      clientName: s.clientName,
      description: `${s.items.reduce((acc, item) => acc + item.qty, 0)} paquetes · ${formatMXN(s.total)}`,
      status: s.status,
      timestamp: new Date(s.createdAt),
      saleId: s.id,
    }));
    
    // Ordenamos por fecha descendente
    const sortedEvents = allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Filtramos según la búsqueda y el estado seleccionado
    return sortedEvents.filter((evt) => {
      const matchesSearch = evt.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = 
        statusFilter === "Todos" || 
        (statusFilter === "Entregado" && evt.status === "Entregado") ||
        (statusFilter === "Pendiente" && evt.status === "Pendiente");

      return matchesSearch && matchesStatus;
    });
  }, [sales, searchQuery, statusFilter]);

  return (
    <div className="page-shell pb-10 md:px-0 md:pt-8">
      {/* HEADER WITH BACK BUTTON */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate({ to: "/ajustes" })}
          className="grid h-10 w-10 place-items-center rounded-full bg-white border border-border shadow-sm text-text-primary hover:bg-gray-50 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[20px] font-bold leading-tight text-text-primary">Actividad Reciente</h1>
          <p className="text-[13px] text-text-muted">
            Historial de eventos y movimientos
          </p>
        </div>
      </div>

      {/* FILTROS DE BÚSQUEDA Y ESTADO */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Input de búsqueda */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition text-[14px]"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        </div>

        {/* Selectores de Estado */}
        <div className="flex bg-gray-100 p-0.5 rounded-xl border border-border/40 self-start sm:self-auto">
          {(["Todos", "Entregado", "Pendiente"] as StatusFilter[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold transition ${
                statusFilter === tab
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {tab === "Todos" ? "Todos" : tab === "Entregado" ? "Cobrados" : "Pendientes"}
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE EVENTOS */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {recentEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Activity className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-[14px]">No se encontraron eventos</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {recentEvents.slice(0, 50).map((evt) => {
              const t = evt.timestamp;
              const dateStr = t.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
              const timeStr = t.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

              return (
                <li key={evt.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-light text-primary mt-0.5">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-[14px] font-semibold text-text-primary truncate pr-2">{evt.title}</p>
                      <p className="text-[12px] text-text-muted shrink-0 whitespace-nowrap">
                        {dateStr}, {timeStr}
                      </p>
                    </div>
                    <p className="text-[13px] text-text-secondary mt-1">{evt.description}</p>
                    <div className="mt-2">
                      {evt.status === "Entregado" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold px-2.5 py-0.5">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Entregado y cobrado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning text-[11px] font-semibold px-2.5 py-0.5">
                          <Clock className="h-3.5 w-3.5" /> Venta pendiente
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
