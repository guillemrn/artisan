import type { Sale, Client, Product } from "./artisan-data";

// ─── Generic helpers ──────────────────────────────────────────────────────────

/** Convert an array of objects to CSV text. */
export function toCSV(rows: Record<string, string | number>[], headers: string[]): string {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ];
  return lines.join("\n");
}

/** Parse CSV text into an array of objects keyed by the header row. */
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    // Simple CSV split (handles quoted fields)
    const values: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        values.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    values.push(cur.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? "";
    });
    return obj;
  });
}

/** Trigger a browser download of a CSV file. */
export function downloadCSV(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sales ────────────────────────────────────────────────────────────────────

const SALE_HEADERS = [
  "id",
  "fecha",
  "cliente",
  "canal",
  "productos",
  "total",
  "costo",
  "ganancia",
  "pago",
  "estado",
];

export function exportSalesCSV(sales: Sale[]) {
  const rows = sales.map((s) => ({
    id: s.id,
    fecha: new Date(s.createdAt).toLocaleString("es-MX"),
    cliente: s.clientName,
    canal: s.channel,
    productos: s.items.map((i) => `${i.productName} ×${i.qty}`).join(" | "),
    total: s.total,
    costo: s.cost,
    ganancia: s.profit,
    pago: s.payment,
    estado: s.status,
  }));
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(`artisan_ventas_${date}.csv`, toCSV(rows, SALE_HEADERS));
}

// ─── Clients ─────────────────────────────────────────────────────────────────

const CLIENT_HEADERS = ["id", "nombre", "canal", "ultima_entrega"];

export function exportClientsCSV(clients: Client[]) {
  const rows = clients.map((c) => ({
    id: c.id,
    nombre: c.name,
    canal: c.channel,
    ultima_entrega: c.lastDelivery ?? "",
  }));
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(`artisan_clientes_${date}.csv`, toCSV(rows, CLIENT_HEADERS));
}

export function parseClientsCSV(text: string): Client[] {
  return parseCSV(text).map((r) => ({
    id: r.id || crypto.randomUUID(),
    name: r.nombre || r.name || "",
    channel: (r.canal || r.channel || "PDV") as Client["channel"],
    lastDelivery: r.ultima_entrega || r.lastDelivery || undefined,
  }));
}

// ─── Products ─────────────────────────────────────────────────────────────────

const PRODUCT_HEADERS = ["id", "nombre", "costo", "precio_dist", "precio_pub", "stock"];

export function exportProductsCSV(products: Product[]) {
  const rows = products.map((p) => ({
    id: p.id,
    nombre: p.name,
    costo: p.cost,
    precio_dist: p.distributorPrice,
    precio_pub: p.publicPrice,
    stock: p.stock,
  }));
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(`artisan_productos_${date}.csv`, toCSV(rows, PRODUCT_HEADERS));
}

export function parseProductsCSV(text: string): Product[] {
  return parseCSV(text).map((r) => ({
    id: r.id || crypto.randomUUID(),
    name: r.nombre || r.name || "",
    cost: parseFloat(r.costo || r.cost || "0"),
    distributorPrice: parseFloat(r.precio_dist || r.distributorPrice || "0"),
    publicPrice: parseFloat(r.precio_pub || r.publicPrice || "0"),
    stock: parseInt(r.stock || "0", 10),
  }));
}
