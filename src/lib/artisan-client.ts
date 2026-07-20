import type { Client } from "./artisan-data";

export function slugifyClientId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function createClientFromName(
  name: string,
  channel: "PDV" | "Público",
  lastDelivery = "Añadido hoy",
): Client {
  return {
    id: slugifyClientId(name),
    name: name.trim(),
    channel,
    lastDelivery,
  };
}
