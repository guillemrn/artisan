import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  PackagePlus,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ModalSuccessState } from "@/components/ui/ModalSuccessState";
import { formatMXN, type Product } from "@/lib/artisan-data";
import {
  COSTING_CATEGORY_LABELS,
  COSTING_UNIT_LABELS,
  calculateCostingItem,
  calculateProductCosting,
  compatibleUnits,
  type CostingCategory,
  type CostingMode,
  type CostingUnit,
  type ProductCosting,
  type ProductCostingItem,
} from "@/lib/product-costing";

type CostMethod = "known" | "calculate";

type Props = {
  onClose: () => void;
  onCreate: (product: Product, costing?: ProductCosting) => Promise<void>;
};

const units = Object.keys(COSTING_UNIT_LABELS) as CostingUnit[];

const numberValue = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const newItem = (category: CostingCategory): ProductCostingItem => ({
  id: crypto.randomUUID(),
  name: "",
  category,
  mode: category === "production" ? "fixed" : "proportional",
  purchaseCost: 0,
  purchaseQuantity: category === "production" ? undefined : 1,
  purchaseUnit: category === "production" ? undefined : "piece",
  usageQuantity: category === "production" ? undefined : 1,
  usageUnit: category === "production" ? undefined : "piece",
});

function marginFor(price: number, cost: number) {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

export function ProductCreationFlow({ onClose, onCreate }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [costMethod, setCostMethod] = useState<CostMethod | null>(null);
  const [knownCost, setKnownCost] = useState("");
  const [yieldQuantity, setYieldQuantity] = useState("");
  const [unitsPerProduct, setUnitsPerProduct] = useState("");
  const [items, setItems] = useState<ProductCostingItem[]>([]);
  const [distributorPrice, setDistributorPrice] = useState("");
  const [publicPrice, setPublicPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const costingResult = useMemo(() => {
    if (costMethod !== "calculate") return null;
    try {
      return calculateProductCosting(
        numberValue(yieldQuantity),
        numberValue(unitsPerProduct),
        items,
      );
    } catch {
      return null;
    }
  }, [costMethod, items, unitsPerProduct, yieldQuantity]);

  const productCost =
    costMethod === "calculate" ? (costingResult?.productCost ?? 0) : numberValue(knownCost);

  const updateItem = (id: string, patch: Partial<ProductCostingItem>) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        if (patch.purchaseUnit) {
          const compatible = compatibleUnits(patch.purchaseUnit);
          if (!next.usageUnit || !compatible.includes(next.usageUnit)) {
            next.usageUnit = patch.purchaseUnit;
          }
        }
        return next;
      }),
    );
  };

  const addItem = (category: CostingCategory) => {
    setItems((current) => [...current, newItem(category)]);
  };

  const validateStep = () => {
    setError(null);
    if (step === 1) {
      if (!name.trim()) throw new Error("Escribe el nombre del producto.");
      if (!Number.isFinite(Number(stock)) || Number(stock) < 0) {
        throw new Error("El inventario inicial debe ser cero o mayor.");
      }
    }
    if (step === 2) {
      if (!costMethod) throw new Error("Elige cómo quieres registrar el costo.");
      if (costMethod === "known") {
        if (!Number.isFinite(Number(knownCost)) || Number(knownCost) < 0) {
          throw new Error("Escribe un costo válido.");
        }
      } else {
        const costing = calculateProductCosting(
          Number(yieldQuantity),
          Number(unitsPerProduct),
          items,
        );
        items.forEach((item) => {
          if (!item.name.trim()) throw new Error("Ponle nombre a cada insumo o gasto.");
        });
      }
    }
  };

  const goNext = () => {
    try {
      validateStep();
      setStep((current) => Math.min(3, current + 1));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Revisa la información.");
    }
  };

  const submit = async () => {
    if (isSubmitting) return;
    setError(null);
    const dist = Number(distributorPrice);
    const publicValue = Number(publicPrice);
    if (!Number.isFinite(dist) || dist < 0 || !Number.isFinite(publicValue) || publicValue < 0) {
      setError("Escribe precios válidos para guardar el producto.");
      return;
    }

    const trimmedName = name.trim();
    const slug = trimmedName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const costing = costMethod === "calculate" ? costingResult ?? undefined : undefined;
    const product: Product = {
      id: slug || `producto-${Date.now()}`,
      name: trimmedName,
      stock: Math.floor(Number(stock)),
      cost: productCost,
      distributorPrice: dist,
      publicPrice: publicValue,
      costing,
    };

    try {
      setIsSubmitting(true);
      await onCreate(product, costing);
      setCreatedProduct(product);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar el producto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdProduct) {
    return (
      <ModalFrame onClose={onClose} canClose>
        <ModalSuccessState
          badgeText={createdProduct.costing ? "Costo calculado" : "Catálogo actualizado"}
          title={`¡${createdProduct.name} agregado!`}
          description={
            createdProduct.costing ? (
              <span>
                Artisan calculó el costo de la presentación a partir de un lote de{" "}
                <strong className="font-bold text-text-primary">
                  {createdProduct.costing.yieldQuantity} unidades
                </strong>
                .
              </span>
            ) : (
              "El producto quedó listo para vender y controlar en inventario."
            )
          }
          details={[
            { label: "Costo del producto", value: formatMXN(createdProduct.cost) },
            { label: "Precio PDV", value: formatMXN(createdProduct.distributorPrice) },
            { label: "Precio público", value: formatMXN(createdProduct.publicPrice) },
          ]}
          onDone={onClose}
          actionText="Listo"
        />
      </ModalFrame>
    );
  }

  return (
    <ModalFrame onClose={onClose} canClose={!isSubmitting} wide={step === 2 && costMethod === "calculate"}>
      <div className="border-b border-border px-5 pb-4 pt-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-bold leading-tight text-text-primary">
              {step === 1 && "Nuevo producto"}
              {step === 2 && "Define su costo"}
              {step === 3 && "Precios de venta"}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-text-muted">
              {step === 1 && "Empieza por lo que vendes y cuánto tienes disponible."}
              {step === 2 && "Usa un costo conocido o calcúlalo a partir de tu producción."}
              {step === 3 && "Revisa el costo y decide cuánto cobrarás en cada canal."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl text-text-muted transition hover:bg-muted hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2" aria-label={`Paso ${step} de 3`}>
          {[1, 2, 3].map((position) => (
            <div
              key={position}
              className={`h-1 rounded-full transition-colors ${position <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
      </div>

      <div className="max-h-[calc(100dvh-13rem)] overflow-y-auto px-5 py-5 sm:max-h-[68vh] sm:px-6">
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-[13px] leading-relaxed text-danger" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <Field label="Nombre del producto">
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ej. Paquete de pan pita"
                className="form-input"
              />
            </Field>
            <Field label="Inventario inicial" hint="Cuántas presentaciones tienes listas para vender.">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
                placeholder="0"
                className="form-input"
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <p className="text-[15px] font-bold text-text-primary">
                ¿Ya conoces el costo de una presentación?
              </p>
              <p className="mt-1 max-w-[62ch] text-[13px] leading-relaxed text-text-muted">
                Una presentación es exactamente lo que entregas al cliente, por ejemplo un paquete de 4 pitas.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MethodButton
                selected={costMethod === "known"}
                icon={ReceiptText}
                title="Sí, ya lo conozco"
                description="Captura el costo final directamente."
                onClick={() => {
                  setCostMethod("known");
                  setError(null);
                }}
              />
              <MethodButton
                selected={costMethod === "calculate"}
                icon={Calculator}
                title="Ayúdame a calcularlo"
                description="Desglosa insumos, empaque y producción."
                onClick={() => {
                  setCostMethod("calculate");
                  setError(null);
                  if (items.length === 0) setItems([newItem("ingredient")]);
                }}
              />
            </div>

            {costMethod === "known" && (
              <div className="max-w-sm pt-1">
                <Field label="Costo por presentación">
                  <MoneyInput value={knownCost} onChange={setKnownCost} placeholder="8.06" />
                </Field>
              </div>
            )}

            {costMethod === "calculate" && (
              <div className="space-y-6">
                <div className="grid gap-3 rounded-2xl bg-[#F4F7F5] p-4 sm:grid-cols-2 sm:p-5">
                  <Field label="¿Cuántas unidades produce el lote?" hint="Ej. 60 pitas">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={yieldQuantity}
                      onChange={(event) => setYieldQuantity(event.target.value)}
                      placeholder="60"
                      className="form-input bg-white"
                    />
                  </Field>
                  <Field label="¿Cuántas incluye cada presentación?" hint="Ej. 4 pitas por paquete">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      value={unitsPerProduct}
                      onChange={(event) => setUnitsPerProduct(event.target.value)}
                      placeholder="4"
                      className="form-input bg-white"
                    />
                  </Field>
                  {numberValue(yieldQuantity) > 0 && numberValue(unitsPerProduct) > 0 && (
                    <p className="text-[12px] text-text-muted sm:col-span-2">
                      Este lote produce aproximadamente{" "}
                      <strong className="font-bold text-text-primary">
                        {(numberValue(yieldQuantity) / numberValue(unitsPerProduct)).toLocaleString("es-MX", {
                          maximumFractionDigits: 2,
                        })}
                      </strong>{" "}
                      presentaciones.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 className="text-[15px] font-bold text-text-primary">Insumos y gastos del lote</h3>
                      <p className="mt-1 text-[12px] text-text-muted">
                        Registra la compra completa y cuánto utilizas en esta producción.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(["ingredient", "packaging", "production"] as CostingCategory[]).map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => addItem(category)}
                          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-[12px] font-bold text-text-secondary transition hover:border-primary/30 hover:text-primary"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {COSTING_CATEGORY_LABELS[category]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {items.map((item) => (
                      <CostingItemRow
                        key={item.id}
                        item={item}
                        onChange={(patch) => updateItem(item.id, patch)}
                        onRemove={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                      />
                    ))}
                  </div>
                </div>

                <CostSummary costing={costingResult} />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#EDF6F1] px-4 py-4">
              <div>
                <p className="text-[12px] font-semibold text-primary">Costo por presentación</p>
                <p className="mt-0.5 text-[24px] font-extrabold tabular-nums text-text-primary">
                  {formatMXN(productCost)}
                </p>
              </div>
              {costMethod === "calculate" && (
                <div className="flex items-center gap-2 text-right text-[12px] font-semibold text-primary">
                  <Sparkles className="h-4 w-4" />
                  Calculado por Artisan
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <PriceField
                label="Precio para punto de venta"
                value={distributorPrice}
                onChange={setDistributorPrice}
                cost={productCost}
              />
              <PriceField
                label="Precio público"
                value={publicPrice}
                onChange={setPublicPrice}
                cost={productCost}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-white px-5 py-4 sm:px-6">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep((current) => current - 1);
            }}
            disabled={isSubmitting}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl px-3 text-[13px] font-bold text-text-secondary transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Regresar
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="h-11 cursor-pointer rounded-xl px-3 text-[13px] font-bold text-text-secondary transition hover:bg-muted"
          >
            Cancelar
          </button>
        )}

        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-bold text-white transition hover:bg-[#246448] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={isSubmitting}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-bold text-white transition hover:bg-[#246448] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Guardando..." : "Guardar producto"}
            {!isSubmitting && <Check className="h-4 w-4" />}
          </button>
        )}
      </div>
    </ModalFrame>
  );
}

function ModalFrame({
  children,
  onClose,
  canClose,
  wide = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  canClose: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-0 sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Crear producto"
      onMouseDown={(event) => {
        if (canClose && event.currentTarget === event.target) onClose();
      }}
    >
      <div
        className={`w-full overflow-hidden rounded-t-2xl bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] sm:rounded-2xl ${
          wide ? "sm:max-w-[900px]" : "sm:max-w-[560px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[12px] font-bold text-text-secondary">{label}</span>
      {hint && <span className="mt-0.5 block text-[11px] leading-relaxed text-text-muted">{hint}</span>}
      <span className="mt-1.5 block">{children}</span>
    </label>
  );
}

function MethodButton({
  selected,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  icon: typeof Calculator;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-24 cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
        selected
          ? "border-primary bg-[#EDF6F1] text-primary"
          : "border-border bg-white text-text-secondary hover:border-primary/30"
      }`}
    >
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-white" : "bg-muted"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-[13px] font-bold text-text-primary">{title}</span>
        <span className="mt-1 block text-[12px] leading-relaxed text-text-muted">{description}</span>
      </span>
    </button>
  );
}

function MoneyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-text-muted">$</span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="form-input pl-8 tabular-nums"
      />
    </span>
  );
}

function CostingItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: ProductCostingItem;
  onChange: (patch: Partial<ProductCostingItem>) => void;
  onRemove: () => void;
}) {
  const lineCost = useMemo(() => {
    try {
      return calculateCostingItem(item);
    } catch {
      return null;
    }
  }, [item]);

  const usageUnits = item.purchaseUnit ? compatibleUnits(item.purchaseUnit) : units;

  return (
    <div className="rounded-xl border border-border bg-white p-3.5 sm:p-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(180px,1fr)_150px_150px_40px]">
        <Field label="Nombre">
          <input
            value={item.name}
            onChange={(event) => onChange({ name: event.target.value })}
            placeholder={item.category === "production" ? "Ej. Gas estimado" : "Ej. Harina"}
            className="form-input h-10"
          />
        </Field>
        <Field label="Tipo">
          <select
            value={item.category}
            onChange={(event) => onChange({ category: event.target.value as CostingCategory })}
            className="form-input h-10 cursor-pointer"
          >
            {Object.entries(COSTING_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Cómo se calcula">
          <select
            value={item.mode}
            onChange={(event) => onChange({ mode: event.target.value as CostingMode })}
            className="form-input h-10 cursor-pointer"
          >
            <option value="proportional">Según lo usado</option>
            <option value="fixed">Costo fijo del lote</option>
          </select>
        </Field>
        <button
          type="button"
          onClick={onRemove}
          className="mt-auto grid h-10 w-10 cursor-pointer place-items-center rounded-lg text-text-muted transition hover:bg-red-50 hover:text-danger"
          aria-label={`Eliminar ${item.name || "insumo"}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {item.mode === "fixed" ? (
        <div className="mt-3 grid items-end gap-3 sm:grid-cols-[220px_1fr]">
          <Field label="Costo de este lote">
            <MoneyInput
              value={item.purchaseCost ? String(item.purchaseCost) : ""}
              onChange={(value) => onChange({ purchaseCost: numberValue(value) })}
              placeholder="10.00"
            />
          </Field>
          <p className="pb-2 text-[12px] leading-relaxed text-text-muted">
            Úsalo para gas, electricidad, mano de obra u otros gastos que aplican completos a esta producción.
          </p>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_1fr_auto] lg:items-end">
          <div className="grid grid-cols-[1fr_1fr_90px] gap-2">
            <Field label="Pagaste">
              <MoneyInput
                value={item.purchaseCost ? String(item.purchaseCost) : ""}
                onChange={(value) => onChange({ purchaseCost: numberValue(value) })}
                placeholder="37.40"
              />
            </Field>
            <Field label="Por esta cantidad">
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.purchaseQuantity || ""}
                onChange={(event) => onChange({ purchaseQuantity: numberValue(event.target.value) })}
                placeholder="2"
                className="form-input tabular-nums"
              />
            </Field>
            <Field label="Unidad">
              <select
                value={item.purchaseUnit}
                onChange={(event) => onChange({ purchaseUnit: event.target.value as CostingUnit })}
                className="form-input cursor-pointer px-2"
              >
                {units.map((unit) => <option key={unit} value={unit}>{COSTING_UNIT_LABELS[unit]}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <Field label="Usas en el lote">
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.usageQuantity || ""}
                onChange={(event) => onChange({ usageQuantity: numberValue(event.target.value) })}
                placeholder="1.35"
                className="form-input tabular-nums"
              />
            </Field>
            <Field label="Unidad">
              <select
                value={item.usageUnit}
                onChange={(event) => onChange({ usageUnit: event.target.value as CostingUnit })}
                className="form-input cursor-pointer px-2"
              >
                {usageUnits.map((unit) => <option key={unit} value={unit}>{COSTING_UNIT_LABELS[unit]}</option>)}
              </select>
            </Field>
          </div>
          <div className="min-w-28 rounded-lg bg-muted px-3 py-2.5 text-right">
            <p className="text-[10px] font-semibold text-text-muted">Costo en receta</p>
            <p className="mt-0.5 text-[14px] font-extrabold tabular-nums text-text-primary">
              {lineCost === null ? "—" : formatMXN(lineCost)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CostSummary({ costing }: { costing: ProductCosting | null }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-3">
      <SummaryCell label="Costo del lote" value={costing ? formatMXN(costing.batchCost) : "—"} />
      <SummaryCell label="Costo por unidad" value={costing ? formatMXN(costing.unitCost) : "—"} />
      <SummaryCell
        label="Costo de la presentación"
        value={costing ? formatMXN(costing.productCost) : "—"}
        emphasized
      />
    </div>
  );
}

function SummaryCell({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className={emphasized ? "bg-[#EDF6F1] p-4" : "bg-white p-4"}>
      <p className={`text-[11px] font-semibold ${emphasized ? "text-primary" : "text-text-muted"}`}>{label}</p>
      <p className="mt-1 text-[18px] font-extrabold tabular-nums text-text-primary">{value}</p>
    </div>
  );
}

function PriceField({
  label,
  value,
  onChange,
  cost,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  cost: number;
}) {
  const price = numberValue(value);
  const margin = marginFor(price, cost);
  return (
    <div>
      <Field label={label}>
        <MoneyInput value={value} onChange={onChange} placeholder="0.00" />
      </Field>
      {price > 0 && (
        <p className={`mt-2 text-[12px] ${price < cost ? "text-danger" : "text-text-muted"}`}>
          {price < cost
            ? `Está ${formatMXN(cost - price)} por debajo del costo.`
            : `${formatMXN(price - cost)} de ganancia · ${margin.toFixed(0)}% de margen`}
        </p>
      )}
    </div>
  );
}
