import type { Client } from "./artisan-data";

export function createClientFromName(
  name: string,
  channel: "PDV" | "Público",
  lastDelivery = "Añadido hoy",
): Client {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    channel,
    lastDelivery,
  };
}
