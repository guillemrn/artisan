import { CheckIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { PASSWORD_REQUIREMENTS } from "@/lib/password-security";

export function PasswordRequirements({ id, password }: { id?: string; password: string }) {
  return (
    <div id={id} role="list" className="grid grid-cols-2 gap-x-3 gap-y-2">
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const isMet = requirement.test(password);

        return (
          <div
            key={requirement.id}
            role="listitem"
            aria-label={`${requirement.label}: ${isMet ? "cumplido" : "pendiente"}`}
            className={cn(
              "flex min-w-0 items-center gap-2 text-[12px] transition-colors",
              isMet ? "font-semibold text-success" : "text-text-muted",
            )}
          >
            <span
              className={cn(
                "grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors",
                isMet
                  ? "border-success bg-success text-primary-foreground"
                  : "border-border bg-surface",
              )}
              aria-hidden="true"
            >
              {isMet ? <CheckIcon className="h-2.5 w-2.5" weight="bold" /> : null}
            </span>
            <span>{requirement.label}</span>
          </div>
        );
      })}
    </div>
  );
}
