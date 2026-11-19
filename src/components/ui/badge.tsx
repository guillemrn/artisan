import type { ReactNode } from "react";
import { clsx } from "clsx";

/**
 * Estados del sistema. Siempre con texto, nunca solo color.
 * success = cobrado · warning = por cobrar · danger = vencido/error ·
 * info = en curso sin acción (consignación, sugerencias) · neutral = solo cambio, etiquetas.
 */
export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral";

const tones: Record<BadgeTone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  neutral: "bg-border-soft text-text-secondary",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-sm px-2 py-0.5 text-[12px] font-semibold",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
