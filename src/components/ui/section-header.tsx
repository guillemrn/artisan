import type { ReactNode } from "react";

/** Encabezado de sección: título + subtítulo opcional + acción a la derecha. */
export function SectionHeader({
  title,
  subtitle,
  action,
  as: Tag = "h2",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  as?: "h2" | "h3";
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Tag className="font-display text-[17px] font-bold text-text-primary">{title}</Tag>
        {subtitle && <p className="text-[13px] text-text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
