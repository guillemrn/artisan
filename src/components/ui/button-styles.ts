import { clsx, type ClassValue } from "clsx";

/**
 * Estilos de botón del sistema Editorial Tech.
 * - cta: naranja, UNA sola acción principal por pantalla (vender, guardar venta).
 * - primary: negro, confirmar.
 * - secondary: contorno, acciones secundarias.
 * - ghost: sin fondo, acciones terciarias.
 * - danger: acciones destructivas.
 */
export type ButtonVariant = "cta" | "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  cta: "bg-cta font-bold text-cta-foreground hover:bg-cta-hover",
  primary: "bg-primary text-primary-foreground hover:bg-primary/85",
  secondary:
    "border border-border bg-surface text-text-primary hover:border-text-primary hover:bg-surface-2",
  ghost: "text-text-primary hover:bg-surface-2",
  danger: "bg-danger text-primary-foreground hover:bg-danger/90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-4 text-[14px]",
  lg: "h-13 px-6 text-[16px]",
};

export function buttonClass({
  variant = "secondary",
  size = "md",
  block = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: ClassValue;
} = {}) {
  return clsx(base, variants[variant], sizes[size], block && "w-full", className);
}
