import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { COMMON_NAV, NAV } from "@/lib/nav";
import { apiGetOrNull, requireSession } from "@/lib/server";

// Todo lo que esta dentro de (app) exige sesion y se dibuja con el menu del rol del usuario
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  const me = await apiGetOrNull<{ name: string }>("/users/me");
  const displayName = me?.name.trim() || session.email;

  return (
    <AppShell name={displayName} role={session.role} items={NAV[session.role]} common={COMMON_NAV}>
      {children}
    </AppShell>
  );
}
