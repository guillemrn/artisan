import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { PASSWORD_REQUIREMENTS } from "@/lib/password-security";

export function PasswordRequirements({ password }: { password: string }) {
  return (
    <div aria-live="polite" className="grid gap-2 pt-1 sm:grid-cols-2">
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const isMet = requirement.test(password);

        return (
          <div
            key={requirement.id}
            className={cn(
              "flex min-w-0 items-center gap-2 text-[12px] transition-colors",
              isMet ? "font-semibold text-primary" : "text-text-muted",
            )}
          >
            <span
              className={cn(
                "grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors",
                isMet ? "border-primary bg-primary text-white" : "border-border bg-white",
              )}
              aria-hidden="true"
            >
              {isMet ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
            </span>
            <span>{requirement.label}</span>
          </div>
        );
      })}
    </div>
  );
}
