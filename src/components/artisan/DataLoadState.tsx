import { WarningCircleIcon } from "@phosphor-icons/react";

import { Skeleton } from "@/components/ui/skeleton";

type DataLoadStateProps = {
  title?: string;
  description?: string;
  variant?: "dashboard" | "list" | "table" | "detail" | "form";
};

/**
 * Esqueletos con la misma estructura que la pantalla real (sin tarjetas extra),
 * para que al cargar nada "brinque".
 */
export function DataLoadSkeleton({
  title = "Cargando tu información",
  description = "Estamos conectando con tus datos.",
  variant = "list",
}: DataLoadStateProps) {
  return (
    <div
      className="page-shell space-y-6 md:px-0 md:pt-6"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">
        {title}. {description}
      </span>

      {/* Encabezado */}
      <div>
        <Skeleton className="h-3 w-56 max-w-[70%]" />
        <Skeleton className="mt-3 h-9 w-72 max-w-full md:h-10" />
      </div>

      {variant === "dashboard" ? <DashboardSkeleton /> : null}
      {variant === "list" ? <ListSkeleton rows={6} /> : null}
      {variant === "table" ? <TableSkeleton /> : null}
      {variant === "detail" ? <DetailSkeleton /> : null}
      {variant === "form" ? <FormSkeleton /> : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      {/* Periodo y filtros */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Skeleton className="h-10 w-full sm:w-[420px]" />
        <Skeleton className="h-10 w-full sm:w-[220px]" />
      </div>

      {/* Resultado */}
      <div className="flex flex-col border-t-2 border-border lg:flex-row">
        <div className="flex flex-col gap-3 py-5 lg:flex-[5] lg:pr-10">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-16 w-48 md:h-[72px] md:w-64" />
          <Skeleton className="h-3 w-full max-w-[380px]" />
          <Skeleton className="h-3 w-2/3 max-w-[260px]" />
        </div>
        <div className="flex flex-col gap-4 border-t border-border-soft py-5 lg:flex-[7] lg:border-l lg:border-t-0 lg:pl-10">
          <Skeleton className="h-3 w-64 max-w-full" />
          <Skeleton className="h-8 w-full" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 border-y border-border-soft lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-2 py-4 pr-4 [&:nth-child(even)]:pl-4 lg:pl-5 lg:first:pl-0"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Widgets */}
      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-3 border-t-2 border-border pt-4">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-60 max-w-full" />
            <Skeleton className="h-[88px] w-full" />
          </div>
        ))}
      </div>
    </>
  );
}

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <>
      <Skeleton className="h-11 w-full" />
      <ul className="border-t-2 border-border">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 border-b border-border-soft py-4">
            <Skeleton className="h-10 w-10 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 max-w-[260px]" />
              <Skeleton className="h-3 w-1/3 max-w-[160px]" />
            </div>
            <Skeleton className="h-5 w-16" />
          </li>
        ))}
      </ul>
    </>
  );
}

function TableSkeleton() {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 border-t-2 border-border pt-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
          </div>
        ))}
      </div>
      <ListSkeleton rows={6} />
    </>
  );
}

function DetailSkeleton() {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 border-t-2 border-border pt-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
      <ListSkeleton rows={3} />
    </>
  );
}

function FormSkeleton() {
  return (
    <div className="max-w-xl space-y-5">
      <Skeleton className="h-1.5 w-full" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

export function DataLoadError({ message }: { message?: string | null }) {
  return (
    <div className="page-shell flex min-h-[55vh] items-center justify-center md:px-0 md:pt-8">
      <div className="max-w-md border-t-2 border-danger pt-6 text-center">
        <WarningCircleIcon className="mx-auto h-8 w-8 text-danger" />
        <h1 className="mt-4 font-display text-[20px] font-bold text-text-primary">
          No pudimos cargar tus datos
        </h1>
        <p className="mt-2 text-[15px] leading-6 text-text-secondary">
          Revisa tu conexión e intenta recargar. No mostramos datos de ejemplo para evitar
          confusiones.
        </p>
        {message ? <p className="mt-3 text-[12px] text-text-muted">{message}</p> : null}
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-[14px] font-semibold text-primary-foreground transition hover:bg-primary/85 active:scale-[0.97]"
        >
          Recargar
        </button>
      </div>
    </div>
  );
}
