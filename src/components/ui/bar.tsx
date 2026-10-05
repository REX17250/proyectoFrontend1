import { cn } from "@/lib/cn";

// Barra horizontal para comparar valores (los graficos del panel son solo CSS)
export function Bar({ value, max = 100, tone = "primary", label }: { value: number; max?: number; tone?: "primary" | "success" | "warning" | "danger"; label: string }) {
  const safeValue = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? (safeValue / max) * 100 : 0;
  const TONE = { primary: "bg-primary-600", success: "bg-success-600", warning: "bg-accent-400", danger: "bg-danger-600" };
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-primary-100" role="progressbar" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className={cn("h-full rounded-full", TONE[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
