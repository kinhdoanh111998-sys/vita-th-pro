import { HEADER, STATUS_META } from "@/lib/project-status/data";

export function DashboardHeader() {
  const { done, doing, pending, todo } = HEADER.counts;
  const total = done + doing + pending + todo;

  return (
    <section className="rounded-3xl border border-[#c9a24b]/40 bg-white shadow-[0_10px_40px_-20px_rgba(27,150,6,0.25)] p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7a5b1d]">
            <span className="rounded-full bg-[#FAF3E0] px-3 py-1">{HEADER.batch}</span>
            <span className="text-[#484848]/60">·</span>
            <span>Cập nhật {HEADER.updatedAt}</span>
            <span className="text-[#484848]/60">·</span>
            <span className="inline-flex items-center gap-1.5 text-[#1B9606]">
              <span className="w-2 h-2 rounded-full bg-[#1B9606] animate-pulse" />
              {HEADER.phase}
            </span>
          </div>

          <h1 className="mt-3 text-2xl md:text-3xl font-black text-[#1a1a1a] leading-tight">
            {HEADER.title}
          </h1>
          <p className="mt-2 text-sm md:text-base text-[#484848] max-w-2xl">{HEADER.subtitle}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div>
              <div className="text-xs text-[#7a5b1d] font-semibold uppercase">Lộ trình</div>
              <div className="font-bold text-[#484848]">
                {HEADER.startDate} → {HEADER.goLiveDate}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#7a5b1d] font-semibold uppercase">Team</div>
              <div className="font-bold text-[#484848]">{HEADER.teams.length} nhóm · {HEADER.teams.reduce((_, __) => _, 0) || 9} người</div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-72 shrink-0 rounded-2xl border border-[#E3E3E3] bg-[#FAFAFA] p-4">
          <div className="flex items-baseline justify-between">
            <div className="text-3xl md:text-4xl font-black text-[#1B9606]">{HEADER.overallPercent}%</div>
            <div className="text-right text-[10px] font-bold uppercase tracking-wider text-[#7a5b1d]">
              Phát triển tính năng
            </div>
          </div>
          <div className="mt-3 h-2.5 w-full rounded-full bg-[#E3E3E3] overflow-hidden flex">
            <div style={{ width: `${(done / total) * 100}%` }} className="bg-emerald-500" />
            <div style={{ width: `${(doing / total) * 100}%` }} className="bg-amber-500" />
            <div style={{ width: `${(pending / total) * 100}%` }} className="bg-orange-500" />
            <div style={{ width: `${(todo / total) * 100}%` }} className="bg-rose-400" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {(["done", "doing", "pending", "todo"] as const).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${STATUS_META[s].dot}`} />
                <span className="text-[#484848]">
                  {STATUS_META[s].label} <b>{HEADER.counts[s]}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {HEADER.teams.map((t) => (
          <div key={t.role} className="rounded-xl border border-[#E3E3E3] bg-[#FAFAFA] px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7a5b1d]">{t.role}</div>
            <div className="text-xs font-semibold text-[#484848] mt-0.5">{t.members}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StatusBadge({ status }: { status: keyof typeof STATUS_META }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${m.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
