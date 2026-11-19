import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Obligatorio: los íconos sin texto necesitan nombre accesible. */
  "aria-label": string;
  variant?: "ghost" | "secondary";
  children: ReactNode;
};

/** Botón cuadrado de 44 px (área táctil mínima) para íconos. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = "ghost", className, type = "button", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        "grid h-11 w-11 shrink-0 place-items-center rounded-md text-text-primary transition-[background-color,transform] duration-150 active:scale-[0.94]",
        variant === "secondary"
          ? "border border-border bg-surface hover:bg-surface-2"
          : "hover:bg-surface-2",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
