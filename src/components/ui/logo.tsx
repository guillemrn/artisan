import React from "react";

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  variant?: "full" | "icon";
}

export function Logo({ variant = "full", className = "", ...props }: LogoProps) {
  const src = variant === "full" ? "/logo.png" : "/isotipo.png";
  const alt = variant === "full" ? "Artisan Logo" : "Artisan Isotipo";

  return <img src={src} alt={alt} className={`object-contain ${className}`} {...props} />;
}
