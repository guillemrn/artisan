import type { ReactNode } from "react";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: "current-password" | "new-password";
  describedBy?: string;
  invalid?: boolean;
  minLength?: number;
  labelAction?: ReactNode;
};

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
  describedBy,
  invalid,
  minLength,
  labelAction,
}: PasswordInputProps) {
  return (
    <div>
      <div className="mb-2 flex min-h-5 items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-bold text-text-primary">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          required
          minLength={minLength}
          maxLength={128}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="••••••••••••"
          className="h-12 w-full rounded-md border border-border bg-surface px-3.5 pr-12 text-[16px] text-text-primary outline-none transition-[border-color,box-shadow] placeholder:text-text-muted focus:border-text-primary focus:ring-3 focus:ring-cta/25 aria-[invalid=true]:border-danger"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-md text-text-muted transition-colors hover:text-text-primary"
        >
          {visible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
