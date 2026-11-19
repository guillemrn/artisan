import { cn } from "@/lib/utils";

/** Bloque de carga con un brillo suave (se apaga con "reducir movimiento"). */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("skeleton-shimmer rounded-sm bg-border-soft", className)}
      {...props}
    />
  );
}

export { Skeleton };
