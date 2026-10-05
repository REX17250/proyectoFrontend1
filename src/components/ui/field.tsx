import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
}

// Campo de formulario con etiqueta visible, ayuda y error asociados al input
export function Field({ label, hint, error, icon, id, className, ...rest }: Props) {
  const fieldId = id ?? rest.name ?? label;
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">{icon}</span>}
        <input
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={cn(
            "min-h-11 w-full rounded-xl border bg-surface px-4 text-sm text-ink placeholder:text-muted",
            "transition-colors focus:border-primary-500",
            icon ? "pl-11" : false,
            error ? "border-danger-600" : "border-line",
            className,
          )}
          {...rest}
        />
      </div>
      {error ? (
        <p id={`${fieldId}-error`} role="alert" className="text-xs font-medium text-danger-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
