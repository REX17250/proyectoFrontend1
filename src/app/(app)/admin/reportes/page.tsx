import type { Metadata } from "next";
import Link from "next/link";
import { Bar } from "@/components/ui/bar";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { ReportPeriodSelect } from "@/components/report-filters";
import { cn } from "@/lib/cn";
import { grade } from "@/lib/format";
import { apiGet, apiGetOrNull } from "@/lib/server";
import type {
  ByProgramRow,
  FacultyRow,
  OccupancyRow,
  Paginated,
  Period,
  Report,
  StudentRankRow,
  SubjectPerformanceRow,
  TeacherLoadRow,
} from "@/lib/types";

export const metadata: Metadata = { title: "Reportes" };

const TABS = [
  { key: "ocupacion", label: "Ocupación" },
  { key: "rendimiento", label: "Rendimiento" },
  { key: "docentes", label: "Docentes" },
  { key: "facultades", label: "Facultades" },
] as const;

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reportes">) {
  const { tab: rawTab, period: rawPeriod } = await searchParams;
  const tab = TABS.find((t) => t.key === rawTab)?.key ?? "ocupacion";

  const [current, periods] = await Promise.all([apiGetOrNull<Period>("/periods/current"), apiGet<Paginated<Period>>("/periods?limit=100")]);
  // Por defecto el periodo abierto; si no hay, el mas reciente
  const periodId = (typeof rawPeriod === "string" && rawPeriod) || current?._id || periods.data[0]?._id;
  const selected = periods.data.find((p) => p._id === periodId);

  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="Indicadores del periodo seleccionado."
        action={
          tab !== "facultades" && periodId ? (
            <ReportPeriodSelect tab={tab} value={periodId} periods={periods.data.map((p) => ({ id: p._id, label: `${p.code}${p.status === "abierto" ? " (abierto)" : p.status === "cerrado" ? " · cerrado" : ""}` }))} />
          ) : undefined
        }
      />

      <nav aria-label="Reportes" className="mb-6 inline-flex flex-wrap rounded-xl border border-line bg-surface p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/reportes?tab=${t.key}${periodId ? `&period=${periodId}` : ""}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={cn("flex min-h-10 items-center rounded-lg px-4 text-sm font-semibold transition-colors sm:px-6", tab === t.key ? "bg-primary-600 text-white" : "text-muted hover:text-ink")}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "facultades" ? (
        <Faculties />
      ) : !periodId ? (
        <EmptyState title="No hay periodos" text="Crea un periodo para ver reportes." />
      ) : tab === "ocupacion" ? (
        <Occupancy period={periodId} />
      ) : tab === "rendimiento" ? (
        <Performance period={periodId} open={selected?.status === "abierto"} />
      ) : (
        <TeacherLoad period={periodId} />
      )}
    </>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 min-w-0">
      <h2 className="text-lg font-bold">{title}</h2>
      {hint && <p className="mb-3 text-sm text-muted">{hint}</p>}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

async function Occupancy({ period }: { period: string }) {
  const [groups, byProgram] = await Promise.all([
    apiGet<Report<OccupancyRow>>(`/reports/group-occupancy?period=${period}&limit=15`),
    apiGet<Report<ByProgramRow>>(`/reports/enrollments-by-program?period=${period}`),
  ]);
  const maxEnrollments = Math.max(...byProgram.rows.map((r) => r.enrollments), 1);

  return (
    <div className="grid min-w-0 gap-8 xl:grid-cols-2">
      <Section title="Grupos más llenos" hint="Los 15 grupos con mayor ocupación de cupos.">
        {groups.rows.length === 0 ? (
          <EmptyState title="No hay grupos en este periodo" />
        ) : (
          <Card className="space-y-4 p-5">
            {groups.rows.map((g) => (
              <div key={g.group}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <strong>{g.subject.name}</strong> <span className="text-muted">G{g.number}</span>
                  </span>
                  <span className="shrink-0 font-semibold">
                    {g.enrolled}/{g.capacity} · {g.occupancyPercent}%
                  </span>
                </div>
                <Bar value={g.occupancyPercent} tone={g.occupancyPercent >= 90 ? "warning" : "primary"} label={`Ocupación de ${g.subject.name}`} />
              </div>
            ))}
          </Card>
        )}
      </Section>

      <Section title="Matrículas por programa" hint="Matrículas vigentes y estudiantes distintos.">
        {byProgram.rows.length === 0 ? (
          <EmptyState title="No hay matrículas en este periodo" />
        ) : (
          <Card className="space-y-4 p-5">
            {byProgram.rows.map((r) => (
              <div key={r.program.id}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate">
                    <strong>{r.program.name}</strong>
                  </span>
                  <span className="shrink-0 text-muted">
                    <strong className="text-ink">{r.enrollments}</strong> matrículas · {r.students} estudiantes
                  </span>
                </div>
                <Bar value={r.enrollments} max={maxEnrollments} label={`Matrículas de ${r.program.name}`} />
              </div>
            ))}
          </Card>
        )}
      </Section>
    </div>
  );
}

async function Performance({ period, open }: { period: string; open: boolean }) {
  const [subjects, top, risk] = await Promise.all([
    apiGet<Report<SubjectPerformanceRow>>(`/reports/subject-performance?period=${period}&limit=15`),
    apiGet<Report<StudentRankRow>>(`/reports/top-students?period=${period}&limit=10`),
    apiGet<Report<StudentRankRow>>(`/reports/at-risk-students?period=${period}&limit=10`),
  ]);

  if (subjects.rows.length === 0 && top.rows.length === 0 && risk.rows.length === 0) {
    return (
      <EmptyState
        title="Aún no hay notas finales en este periodo"
        text={open ? "El rendimiento se calcula con las matrículas ya finalizadas. Elige un periodo cerrado o espera a que los docentes finalicen sus grupos." : "Ningún grupo de este periodo tiene matrículas finalizadas."}
      />
    );
  }

  return (
    <>
      <Section title="Aprobación por materia" hint="Ordenadas de menor a mayor porcentaje de aprobación.">
        <Card className="space-y-4 p-5">
          {subjects.rows.map((s) => (
            <div key={s.subject.id}>
              <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                <span className="min-w-0 truncate">
                  <strong>{s.subject.name}</strong> <span className="text-muted">{s.subject.code}</span>
                </span>
                <span className="shrink-0 text-muted">
                  {s.passed} de {s.finalized} aprobaron · promedio {grade(s.averageGrade)} · <strong className="text-ink">{s.passRate}%</strong>
                </span>
              </div>
              <Bar value={s.passRate} tone={s.passRate < 50 ? "danger" : s.passRate < 75 ? "warning" : "success"} label={`Aprobación de ${s.subject.name}`} />
            </div>
          ))}
        </Card>
      </Section>

      <div className="grid gap-8 xl:grid-cols-2">
        <Section title="Mejores promedios" hint="Promedio ponderado por créditos del periodo.">
          <StudentTable rows={top.rows} empty="Sin datos" />
        </Section>
        <Section title="Estudiantes en riesgo" hint="Con al menos una materia reprobada en el periodo.">
          <StudentTable rows={risk.rows} empty="Ningún estudiante reprobó materias" danger />
        </Section>
      </div>
    </>
  );
}

function StudentTable({ rows, empty, danger }: { rows: StudentRankRow[]; empty: string; danger?: boolean }) {
  if (rows.length === 0) return <EmptyState title={empty} />;
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[26rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th scope="col" className="px-4 py-3 font-semibold">Estudiante</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Promedio</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Aprobadas</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Reprobadas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.student.id} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-semibold">{r.student.name}</p>
                  <p className="text-xs text-muted">{r.student.code}</p>
                </td>
                <td className={cn("px-3 py-3 text-right font-extrabold", danger ? "text-danger-600" : "text-success-600")}>{grade(r.gpa)}</td>
                <td className="px-3 py-3 text-right">{r.passed}</td>
                <td className="px-4 py-3 text-right">{r.failed > 0 ? <Badge tone="danger">{r.failed}</Badge> : 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

async function TeacherLoad({ period }: { period: string }) {
  const load = await apiGet<Report<TeacherLoadRow>>(`/reports/teacher-load?period=${period}&limit=30`);
  if (load.rows.length === 0) return <EmptyState title="No hay docentes con grupos en este periodo" />;
  const max = Math.max(...load.rows.map((r) => r.students), 1);

  return (
    <Section title="Carga docente" hint="Grupos, estudiantes y créditos dictados por cada docente (los de más estudiantes primero).">
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th scope="col" className="px-4 py-3 font-semibold">Docente</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Grupos</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold">Créditos</th>
                <th scope="col" className="min-w-48 px-4 py-3 font-semibold">Estudiantes</th>
              </tr>
            </thead>
            <tbody>
              {load.rows.map((r) => (
                <tr key={r.teacher.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{r.teacher.name}</p>
                    <p className="text-xs text-muted">{r.teacher.code}</p>
                  </td>
                  <td className="px-3 py-3 text-right">{r.groups}</td>
                  <td className="px-3 py-3 text-right">{r.credits}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Bar value={r.students} max={max} label={`Estudiantes de ${r.teacher.name}`} />
                      </div>
                      <span className="w-8 text-right font-bold">{r.students}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Section>
  );
}

async function Faculties() {
  const { rows } = await apiGet<{ rows: FacultyRow[] }>("/reports/faculty-summary");
  const max = Math.max(...rows.map((r) => r.students), 1);

  return (
    <Section title="Resumen por facultad" hint="Programas, docentes y estudiantes de cada facultad.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((r) => (
          <Card key={r.faculty.id} className="p-5">
            <p className="text-xs font-semibold text-muted">{r.faculty.code}</p>
            <h3 className="mb-4 leading-snug font-bold">{r.faculty.name}</h3>
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Programas", r.programs],
                ["Docentes", r.teachers],
                ["Estudiantes", r.students],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl bg-canvas px-2 py-2.5">
                  <dd className="text-xl font-extrabold">{value}</dd>
                  <dt className="text-xs text-muted">{label}</dt>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <Bar value={r.students} max={max} label={`Estudiantes de ${r.faculty.name}`} />
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
