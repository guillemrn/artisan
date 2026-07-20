import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Package, Receipt, Search, Store, User } from "lucide-react";
import { useArtisan } from "@/lib/artisan-store";
import { formatMXN } from "@/lib/artisan-data";

type SearchParams = { q?: string };

export const Route = createFileRoute("/buscar")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: ({ search }) => ({
    meta: [{ title: search.q ? `Buscar: ${search.q} — Artisan` : "Buscar — Artisan" }],
  }),
  component: Buscar,
});

function Buscar() {
  const { q = "" } = Route.useSearch();
  const { sales, clients, products } = useArtisan();
  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) {
      return { sales: [], clients: [], products: [] };
    }

    const matchedSales = sales.filter(
      (s) =>
        s.clientName.toLowerCase().includes(query) ||
        s.items.some((i) => i.productName.toLowerCase().includes(query)),
    );

    const matchedClients = clients.filter((c) => c.name.toLowerCase().includes(query));

    const matchedProducts = products.filter((p) => p.name.toLowerCase().includes(query));

    return {
      sales: matchedSales.slice(0, 8),
      clients: matchedClients.slice(0, 8),
      products: matchedProducts.slice(0, 8),
    };
  }, [sales, clients, products, query]);

  const total = results.sales.length + results.clients.length + results.products.length;

  return (
    <div className="page-shell md:px-0 md:pt-8">
      <div className="flex items-center gap-3">
        <Search className="h-5 w-5 text-primary shrink-0" />
        <div>
          <h1 className="text-[22px] font-bold text-text-primary">Resultados</h1>
          <p className="text-[13px] text-text-muted">
            {query ? (
              <>
                {total} resultado{total !== 1 ? "s" : ""} para{" "}
                <span className="font-semibold text-text-primary">&ldquo;{q}&rdquo;</span>
              </>
            ) : (
              "Escribe en la barra de búsqueda para encontrar ventas, clientes o productos."
            )}
          </p>
        </div>
      </div>

      {!query && (
        <div className="mt-10 flex flex-col items-center gap-3 text-text-muted">
          <Search className="h-10 w-10 opacity-30" />
          <p className="text-[14px]">Usa la búsqueda del encabezado</p>
        </div>
      )}

      {query && total === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 text-text-muted">
          <Search className="h-10 w-10 opacity-30" />
          <p className="text-[14px]">Sin resultados para &ldquo;{q}&rdquo;</p>
        </div>
      )}

      {results.sales.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">Ventas</h2>
          <ul className="mt-3 grid gap-2">
            {results.sales.map((s) => (
              <li key={s.id}>
                <Link
                  to="/ticket/$saleId"
                  params={{ saleId: s.id }}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 transition hover:border-primary/40"
                >
                  <Receipt className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[14px] font-semibold">{s.clientName}</p>
                    <p className="truncate text-[12px] text-text-muted">
                      {s.items.map((i) => i.productName).join(" · ")}
                    </p>
                  </div>
                  <span className="text-[14px] font-bold shrink-0">{formatMXN(s.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.clients.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">
            Clientes
          </h2>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {results.clients.map((c) => (
              <li key={c.id}>
                <Link
                  to="/clientes"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 transition hover:border-primary/40"
                >
                  <div
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                      c.channel === "PDV"
                        ? "bg-primary-light text-primary"
                        : "bg-[#FBF0E8] text-[#C9784A]"
                    }`}
                  >
                    {c.channel === "PDV" ? (
                      <Store className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">{c.name}</p>
                    <p className="text-[12px] text-text-muted">{c.channel}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.products.length > 0 && (
        <section className="mt-8 pb-8">
          <h2 className="text-[13px] font-bold uppercase tracking-wide text-text-muted">
            Productos
          </h2>
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {results.products.map((p) => (
              <li key={p.id}>
                <Link
                  to="/productos"
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 transition hover:border-primary/40"
                >
                  <Package className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[14px] font-semibold">{p.name}</p>
                    <p className="text-[12px] text-text-muted">Stock: {p.stock}</p>
                  </div>
                  <span className="text-[14px] font-bold shrink-0">{formatMXN(p.publicPrice)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
