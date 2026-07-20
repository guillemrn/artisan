import { useState } from "react";
import { Store, User } from "lucide-react";
import { createClientFromName } from "@/lib/artisan-client";
import type { Client } from "@/lib/artisan-data";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (client: Client) => void;
  /** Called after the client is created (e.g. to add to store) */
  onSave: (client: Client) => void;
  title?: string;
  lastDeliveryLabel?: string;
};

export function AddClientSheet({
  open,
  onClose,
  onCreated,
  onSave,
  title = "Agregar nuevo cliente",
  lastDeliveryLabel = "Añadido hoy",
}: Props) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<"PDV" | "Público">("PDV");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const client = createClientFromName(name, channel, lastDeliveryLabel);
    onSave(client);
    onCreated(client);
    setName("");
    setChannel("PDV");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center">
      <div className="w-full max-w-[390px] md:max-w-[480px] bg-surface rounded-t-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
        <h3 className="text-[18px] font-bold text-primary">{title}</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-[12px] font-semibold text-text-secondary block mb-1">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Sra. Clara Gómez"
              className="w-full h-11 px-3.5 rounded-xl border border-border text-[14px] outline-none focus:border-primary bg-background"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-text-secondary block mb-2">
              Canal de venta
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setChannel("PDV")}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold border transition ${
                  channel === "PDV"
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border bg-surface text-text-secondary hover:bg-muted"
                }`}
              >
                <Store className="h-4 w-4" /> Punto de Venta (PDV)
              </button>
              <button
                type="button"
                onClick={() => setChannel("Público")}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold border transition ${
                  channel === "Público"
                    ? "border-[#6D28D9] bg-[#F5F3FF] text-[#6D28D9]"
                    : "border-border bg-surface text-text-secondary hover:bg-muted"
                }`}
              >
                <User className="h-4 w-4" /> Público / Directo
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border py-3 text-[14px] font-semibold text-text-secondary hover:bg-muted transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-xl bg-primary text-white py-3 text-[14px] font-semibold shadow-lg hover:bg-emerald-700 transition"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
