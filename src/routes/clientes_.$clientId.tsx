import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useArtisan } from "@/lib/artisan-store";
import { formatMXN } from "@/lib/artisan-data";
import { ArrowLeft, TrendingUp, Package, Banknote, Calendar, Receipt, AlertCircle, Filter } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/clientes_/$clientId")({
  head: () => ({ meta: [{ title: "Detalle Cliente — Artisan" }] }),
  component: ClientDetail,
});

function ClientDetail() {
  const { clientId } = Route.useParams();
  const { clients, sales } = useArtisan();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "month">("all");
  
  const client = clients.find(c => c.id === clientId);
  
  if (!client) {
    return (
      <div className="page-shell flex flex-col items-center justify-center h-[50vh]">
        <p className="text-text-muted mb-4">Cliente no encontrado</p>
        <button onClick={() => navigate({ to: '/clientes' })} className="text-primary font-bold hover:underline">Volver a clientes</button>
      </div>
    );
  }

  const clientSales = useMemo(() => {
    return sales.filter(s => s.clientId === clientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sales, clientId]);
  
  const stats = useMemo(() => {
    let totalSales = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalDebt = 0;
    const productCounts: Record<string, { name: string, qty: number }> = {};
    
    clientSales.forEach(s => {
      totalSales += s.total;
      totalCost += s.cost;
      totalProfit += s.profit;
      
      if (s.status === "Pendiente") {
        totalDebt += s.total;
      }
      
      s.items.forEach(item => {
        if (!productCounts[item.productId]) {
          productCounts[item.productId] = { name: item.productName, qty: 0 };
        }
        productCounts[item.productId].qty += item.qty;
      });
    });
    
    let topProduct = { name: "Ninguno", qty: 0 };
    for (const p in productCounts) {
      if (productCounts[p].qty > topProduct.qty) {
        topProduct = productCounts[p];
      }
    }
    
    const roi = totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(1) : "0.0";
    
    return {
      totalSales,
      totalProfit,
      totalDebt,
      roi,
      topProduct,
      count: clientSales.length
    };
  }, [clientSales]);

  const filteredSales = useMemo(() => {
    if (filter === "all") return clientSales;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return clientSales.filter(s => new Date(s.createdAt) >= oneMonthAgo);
  }, [clientSales, filter]);

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };
  
  const formatJustDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="page-shell md:px-0 md:pt-8">
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/clientes"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm border border-border text-text-muted transition hover:text-primary hover:-translate-x-0.5"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-[24px] font-bold leading-tight text-text-primary truncate">
            {client.name}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`rounded-full text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 ${client.channel === "PDV" ? "bg-primary-light text-primary" : "bg-[#FBF0E8] text-[#C9784A]"}`}>
              {client.channel}
            </span>
            {client.lastDelivery && (
               <span className="text-[12px] text-text-muted flex items-center gap-1 whitespace-nowrap">
                 <Calendar className="h-3 w-3" /> Última: {client.lastDelivery}
               </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1 text-primary">
            <Banknote className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Ventas Totales</span>
          </div>
          <p className="text-[22px] font-bold leading-tight text-text-primary">{formatMXN(stats.totalSales)}</p>
          <p className="text-[12px] text-text-muted mt-1">{stats.count} {stats.count === 1 ? 'ticket' : 'tickets'}</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm relative overflow-hidden">
          <div className="mb-1 flex items-center gap-1 text-green-600">
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Rentabilidad (ROI)</span>
          </div>
          <p className="text-[22px] font-bold leading-tight text-green-600">{stats.roi}%</p>
          <p className="text-[12px] text-text-muted mt-1 truncate">Ganancia: {formatMXN(stats.totalProfit)}</p>
          {/* Decorative mini sparkline bg */}
          <div className="absolute bottom-0 left-0 right-0 h-8 opacity-10 flex items-end gap-1 px-2 pb-1">
             <div className="w-full bg-green-500 h-[30%] rounded-t-sm"></div>
             <div className="w-full bg-green-500 h-[50%] rounded-t-sm"></div>
             <div className="w-full bg-green-500 h-[40%] rounded-t-sm"></div>
             <div className="w-full bg-green-500 h-[80%] rounded-t-sm"></div>
             <div className="w-full bg-green-500 h-[70%] rounded-t-sm"></div>
             <div className="w-full bg-green-500 h-[100%] rounded-t-sm"></div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1 text-[#C9784A]">
            <Package className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Producto Estrella</span>
          </div>
          <p className="text-[18px] font-bold leading-tight text-text-primary truncate">{stats.topProduct.name}</p>
          <p className="text-[12px] text-text-muted mt-1">{stats.topProduct.qty} unidades</p>
        </div>
        
        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-1 flex items-center gap-1 text-warning-dark">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wide">Deuda Pendiente</span>
          </div>
          <p className={`text-[22px] font-bold leading-tight ${stats.totalDebt > 0 ? "text-warning-dark" : "text-text-primary"}`}>
            {formatMXN(stats.totalDebt)}
          </p>
          <p className="text-[12px] text-text-muted mt-1">Por cobrar</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-[18px] font-bold text-text-primary flex items-center gap-2">
          <Receipt className="h-5 w-5 text-text-muted" /> Historial de Tickets
        </h2>
        <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg w-fit">
          <button 
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition ${filter === "all" ? "bg-white shadow-sm text-text-primary" : "text-text-muted hover:text-text-primary"}`}
          >
            Todo
          </button>
          <button 
            onClick={() => setFilter("month")}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition ${filter === "month" ? "bg-white shadow-sm text-text-primary" : "text-text-muted hover:text-text-primary"}`}
          >
            Último mes
          </button>
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center bg-white/50">
          <Receipt className="mx-auto h-8 w-8 text-text-muted opacity-50 mb-3" />
          <p className="text-text-muted font-medium">No hay tickets registrados para este periodo.</p>
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <ul className="grid gap-3 pb-24 md:hidden">
            {filteredSales.map((sale) => (
              <li key={sale.id}>
                <div className="rounded-2xl border border-border bg-white p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                     <div>
                       <p className="font-bold text-text-primary">#{sale.id.startsWith("s") ? sale.id.toUpperCase() : sale.id}</p>
                       <p className="text-[13px] text-text-muted flex items-center gap-1 mt-0.5">
                         <Calendar className="h-3 w-3" /> {formatDate(sale.createdAt)}
                       </p>
                     </div>
                     <div className="text-right">
                       <p className="font-bold text-primary">{formatMXN(sale.total)}</p>
                       <span className={`inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${sale.status === "Entregado" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                         {sale.status}
                       </span>
                     </div>
                  </div>
                  
                  <div className="pt-2 border-t border-border flex gap-2">
                    <Link
                      to="/ticket/$saleId"
                      params={{ saleId: sale.id }}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted text-text-secondary text-[13px] font-semibold py-2 transition hover:bg-border"
                    >
                      <Receipt className="h-4 w-4" /> Ver Ticket
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-hidden bg-white border border-border rounded-2xl shadow-sm pb-10 mb-20">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-gray-50 border-b border-border text-text-muted text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-4">Productos</th>
                  <th className="py-3.5 px-4">Pago</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4 font-bold text-text-primary">
                      #{s.id.startsWith("s") ? s.id.toUpperCase() : s.id}
                    </td>
                    <td className="py-3.5 px-4 text-text-muted">
                      <div className="font-semibold text-text-primary">{formatJustDate(s.createdAt)}</div>
                      <div className="text-[11px] opacity-75">{new Date(s.createdAt).toLocaleTimeString("es-MX", {hour:"2-digit", minute:"2-digit"})}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="space-y-1 truncate">
                        {s.items.map((i) => (
                          <div key={i.productId} className="text-[12px] leading-tight truncate">
                            {i.qty > 0 && (
                              <span>
                                {i.productName} <span className="text-text-muted">x{i.qty}</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary font-medium">{s.payment}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 rounded-full text-[11px] font-medium px-2 py-0.5 ${
                        s.status === "Entregado" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <p className="font-bold text-primary">{formatMXN(s.total)}</p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/ticket/$saleId"
                        params={{ saleId: s.id }}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
