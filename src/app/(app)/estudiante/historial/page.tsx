import type { Metadata } from "next";
import { Award, BookCheck, GraduationCap, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/feedback";
import { StatCard } from "@/components/stat-card";
import { grade, STATUS_LABEL, STATUS_TONE } from "@/lib/format";
import { apiGet } from "@/lib/server";
import type { History } from "@/lib/types";

export const metadata: Metadata = { title: "Historial" };

export default async function HistoryPage() {
  const h = await apiGet<History>("/students/me/history");
  const s = h.summary;

  return (
    <>
      <PageHeader title="Historial académico" subtitle={`${h.program.name} · Código ${h.student.code}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={TrendingUp} label="Promedio acumulado" value={grade(s.gpa)} hint="Ponderado por créditos" />
        <StatCard icon={BookCheck} label="Créditos aprobados" value={`${s.creditsApproved} / ${h.program.totalCredits}`} hint={`Faltan ${s.creditsRemaining}`} />
        <StatCard icon={Award} label="Materias aprobadas" value={s.subjectsPassed} hint={`${s.subjectsFailed} reprobadas`} />
        <StatCard icon={GraduationCap} label="En curso" value={s.inProgress} />
      </div>

      <Card className="mt-5 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Avance de la carrera</span>
          <span className="font-extrabold">{s.progressPercent}%</span>
        </div>
        <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-primary-100" role="progressbar" aria-valuenow={s.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label="Avance de la carrera">
          <div className="h-full rounded-full bg-primary-600" style={{ width: `${Math.min(s.progressPercent, 100)}%` }} />
        </div>
      </Card>

      {h.periods.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Todavía no hay materias en tu historial" />
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {h.periods.map((p) => (
            <Card key={p.period.id} className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold">Periodo {p.period.code}</h2>
                  <Badge tone={p.period.status === "abierto" ? "success" : p.period.status === "planificado" ? "warning" : "neutral"}>{p.period.status === "abierto" ? "Abierto" : p.period.status === "planificado" ? "Planificado" : "Cerrado"}</Badge>
                </div>
                <p className="text-sm text-muted">
                  {p.credits} créditos · Promedio <strong className="text-ink">{grade(p.gpa)}</strong>
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <caption className="sr-only">Materias del periodo {p.period.code}</caption>
                  <thead>
                    <tr className="text-left text-xs text-muted">
                      <th scope="col" className="px-5 py-2.5 font-semibold">Materia</th>
                      <th scope="col" className="px-3 py-2.5 font-semibold">Grupo</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-semibold">Créditos</th>
                      <th scope="col" className="px-3 py-2.5 text-right font-semibold">Nota final</th>
                      <th scope="col" className="px-5 py-2.5 text-right font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.courses.map((c) => (
                      <tr key={c.enrollment} className="border-t border-line/60">
                        <td className="px-5 py-3">
                          <span className="font-semibold">{c.subject.name}</span>
                          <span className="ml-2 text-xs text-muted">{c.subject.code}</span>
                        </td>
                        <td className="px-3 py-3 text-muted">{c.group}</td>
                        <td className="px-3 py-3 text-right text-muted">{c.subject.credits}</td>
                        <td className="px-3 py-3 text-right font-bold">{grade(c.finalGrade)}</td>
                        <td className="px-5 py-3 text-right">
                          <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
