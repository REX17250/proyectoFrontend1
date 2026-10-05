"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto max-w-lg rounded-(--radius-card) border border-line bg-surface p-6 text-center shadow-(--shadow-card)">
      <h1 className="text-xl font-bold">No se pudo cargar esta página</h1>
      <p className="mt-2 text-sm text-muted">Inténtalo de nuevo. Si el problema continúa, cierra sesión e ingresa otra vez.</p>
      <div className="mt-5 flex justify-center gap-3"><Button onClick={reset}>Reintentar</Button><Button variant="secondary" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }}>Cerrar sesión</Button></div>
    </div>
  );
}
