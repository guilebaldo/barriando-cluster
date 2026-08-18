import {
  ACCESS_ATTENDANCE_COLOR,
  ACCESS_ATTENDANCE_LABEL,
  type AccessAttendanceStatus,
} from "@/lib/access-events";

const ORDER: AccessAttendanceStatus[] = ["on_time", "late", "no_show"];

export default function AdminPaseAttendanceChart({
  onTime,
  late,
  noShow,
}: {
  onTime: number;
  late: number;
  noShow: number;
}) {
  const counts: Record<AccessAttendanceStatus, number> = {
    on_time: onTime,
    late,
    no_show: noShow,
  };
  const total = onTime + late + noShow;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs =
    total === 0
      ? []
      : ORDER.filter((status) => counts[status] > 0).map((status) => {
          const length = (counts[status] / total) * circumference;
          const arc = {
            status,
            dash: `${length} ${circumference - length}`,
            offset,
          };
          offset -= length;
          return arc;
        });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Asistencia</p>
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative mx-auto sm:mx-0 h-36 w-36 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="16" />
            {arcs.map((arc) => (
              <circle
                key={arc.status}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={ACCESS_ATTENDANCE_COLOR[arc.status]}
                strokeWidth="16"
                strokeDasharray={arc.dash}
                strokeDashoffset={arc.offset}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xl font-black tabular-nums text-[#27366D]">{total}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">pases</p>
          </div>
        </div>
        <ul className="flex-1 space-y-2 text-xs">
          {ORDER.map((status) => (
            <li key={status} className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-slate-600">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: ACCESS_ATTENDANCE_COLOR[status] }}
                />
                {ACCESS_ATTENDANCE_LABEL[status]}
              </span>
              <span className="font-semibold tabular-nums text-slate-800">{counts[status]}</span>
            </li>
          ))}
        </ul>
      </div>
      {total === 0 ? (
        <p className="mt-3 text-[11px] text-slate-500">Aún no hay pases emitidos para este evento.</p>
      ) : null}
    </div>
  );
}
