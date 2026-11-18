import type { SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  variant?: "full" | "icon";
}

/**
 * Marca Artisan 2.0 (Editorial Tech): cuadro naranja + wordmark en Satoshi Black.
 * Es un SVG para que escale con clases de altura (h-7 w-auto) como el logo anterior.
 */
export function Logo({ variant = "full", className = "", ...props }: LogoProps) {
  if (variant === "icon") {
    return (
      <svg viewBox="0 0 40 40" role="img" aria-label="Artisan" className={className} {...props}>
        <rect x="8" y="8" width="24" height="24" fill="#FF4F00" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 156 40" role="img" aria-label="Artisan" className={className} {...props}>
      <rect x="2" y="11" width="18" height="18" fill="#FF4F00" />
      <text
        x="28"
        y="30"
        fill="currentColor"
        fontFamily="Satoshi, ui-sans-serif, system-ui, sans-serif"
        fontWeight="900"
        fontSize="29"
        letterSpacing="-0.6"
      >
        Artisan
      </text>
    </svg>
  );
}
