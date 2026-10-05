import { cn } from "@/lib/cn";

// La base de datos no guarda fotos: el avatar se arma con las iniciales y un color que depende del nombre.
// Si algun dia hay un servicio de imagenes (S3), solo se cambia este componente.
const COLORS = [
  "bg-primary-100 text-primary-800",
  "bg-accent-100 text-accent-800",
  "bg-success-100 text-success-800",
  "bg-danger-100 text-danger-600",
  "bg-warning-100 text-warning-800",
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold",
        COLORS[hash % COLORS.length],
        size === "sm" && "size-8 text-xs",
        size === "md" && "size-10 text-sm",
        size === "lg" && "size-16 text-xl",
      )}
    >
      {initials(name)}
    </span>
  );
}
