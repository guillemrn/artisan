import { AlertCircle } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

type DataLoadStateProps = {
  title?: string;
  description?: string;
  variant?: "dashboard" | "list" | "table" | "detail" | "form";
};

export function DataLoadSkeleton({
  title = "Cargando tu información",
  description = "Estamos conectando con tus datos reales.",
  variant = "list",
}: DataLoadStateProps) {
  const showKpis = variant === "dashboard" || variant === "list" || variant === "table";
  const showTable = variant === "table";
  const rows = variant === "dashboard" ? 4 : variant === "detail" ? 3 : 5;

  return (
    <div className="page-shell space-y-5 md:px-0 md:pt-8">
      <div className="max-w-2xl">
        <Skeleton className="h-3 w-24 rounded-full bg-border" />
        <Skeleton className="mt-3 h-9 w-64 max-w-full rounded-xl bg-border" />
        <Skeleton className="mt-3 h-4 w-full max-w-md rounded-full bg-border" />
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-card">
        <h1 className="text-[16px] font-bold text-text-primary">{title}</h1>
        <p className="mt-1 text-[13px] text-text-muted">{description}</p>
      </div>

      {showKpis ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <Skeleton className="h-4 w-24 rounded-full bg-border" />
              <Skeleton className="mt-4 h-8 w-28 rounded-xl bg-border" />
              <Skeleton className="mt-3 h-3 w-20 rounded-full bg-border" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-white p-3 shadow-sm">
        <Skeleton className="h-11 rounded-xl" />
      </div>

      <div
        className={
          showTable
            ? "overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
            : "grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        }
      >
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={
              showTable
                ? "border-b border-border p-4 last:border-b-0"
                : "rounded-2xl border border-border bg-white p-4 shadow-sm"
            }
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-2xl bg-border" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3 rounded-full bg-border" />
                <Skeleton className="h-3 w-1/2 rounded-full bg-border" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full bg-border" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DataLoadError({ message }: { message?: string | null }) {
  return (
    <div className="page-shell flex min-h-[55vh] items-center justify-center md:px-0 md:pt-8">
      <div className="max-w-md rounded-2xl border border-danger/20 bg-white p-6 text-center shadow-card">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-danger">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-[18px] font-bold text-text-primary">No pudimos cargar tus datos</h1>
        <p className="mt-2 text-[14px] leading-6 text-text-secondary">
          La app no mostrará datos demo para evitar confusiones. Revisa tu conexión e intenta
          recargar.
        </p>
        {message ? <p className="mt-3 text-[12px] text-text-muted">{message}</p> : null}
      </div>
    </div>
  );
}
