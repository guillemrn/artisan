import type { SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  variant?: "full" | "icon";
}

/**
 * Marca Grofit: el escalón (cuadro naranja + cuadro de tinta más chico arriba a la derecha)
 * y el wordmark en Satoshi Black. El cuadro chico y el texto usan currentColor,
 * así funciona igual sobre claro y sobre la barra oscura.
 */
function Mark({ x = 0, y = 0, size = 24 }: { x?: number; y?: number; size?: number }) {
  const big = size * 0.72;
  const small = size * 0.36;
  return (
    <>
      <rect x={x} y={y + size - big} width={big} height={big} fill="#FF4F00" />
      <rect x={x + size - small} y={y} width={small} height={small} fill="currentColor" />
    </>
  );
}

export function Logo({ variant = "full", className = "", ...props }: LogoProps) {
  if (variant === "icon") {
    return (
      <svg viewBox="0 0 40 40" role="img" aria-label="Grofit" className={className} {...props}>
        <Mark x={8} y={8} size={24} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 142 40" role="img" aria-label="Grofit" className={className} {...props}>
      <Mark x={1} y={9} size={22} />
      <text
        x="31"
        y="30"
        fill="currentColor"
        fontFamily="Satoshi, ui-sans-serif, system-ui, sans-serif"
        fontWeight="900"
        fontSize="29"
        letterSpacing="-0.6"
      >
        Grofit
      </text>
    </svg>
  );
}
