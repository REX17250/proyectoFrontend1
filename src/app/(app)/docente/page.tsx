import type { Metadata } from "next";
import { Bell, CalendarDays, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/feedback";
import { StatCard } from "@/components/stat-card";
import { apiGet, apiGetOrNull } from "@/lib/server";
import type { Me, Notification, Paginated, Period } from "@/lib/types";

export const metadata: Metadata = { title: "Inicio" };

export default async function TeacherHome() {
  const [me, period] = await Promise.all([apiGet<Me>("/users/me"), apiGetOrNull<Period>("/periods/current")]);
  const [groups, notifications] = await Promise.all([
    apiGetOrNull<Paginated<{ enrolled: number }>>(`/groups/mine?limit=100${period ? `&period=${period._id}` : ""}`),
    apiGetOrNull<Paginated<Notification> & { unread: number }>("/notifications/mine?limit=1"),
  ]);
  const students = groups?.data.reduce((sum, g) => sum + g.enrolled, 0) ?? 0;

  return (
    <>
      <PageHeader title={`Hola, ${me.name.split(" ")[0]}`} subtitle={period ? "Resumen de tus grupos en el periodo abierto." : "No hay un periodo abierto actualmente."} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CalendarDays} label="Periodo actual" value={period ? period.code : "—"} hint={period ? undefined : "No hay un periodo abierto"} />
        <StatCard icon={Users} label="Grupos a mi cargo" value={groups?.meta.total ?? 0} />
        <StatCard icon={Users} label="Estudiantes" value={students} hint="Suma de matriculados en tus grupos" />
        <StatCard icon={Bell} label="Notificaciones sin leer" value={notifications?.unread ?? 0} />
      </div>
    </>
  );
}
