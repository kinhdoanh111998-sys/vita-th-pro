import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, TrendingUp, Target } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const money = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

type Tier = { id: string; tier_name: string; target_amount: number; bonus_amount: number };

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export function PerformanceCard() {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  const { startISO, endISO } = monthRange();

  // Tổng hoa hồng của nhân viên trong tháng (mọi loại)
  const totalQ = useQuery({
    queryKey: ["portal-perf-total", uid, startISO],
    enabled: !!uid,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("commissions")
          .select("amount, created_at")
          .eq("staff_id", uid!)
          .gte("created_at", startISO)
          .lt("created_at", endISO);
        if (error) throw error;
        const sum = (data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
        return Number.isFinite(sum) ? sum : 0;
      } catch (e) {
        console.warn("[PerformanceCard] total error", e);
        return 0;
      }
    },
  });

  const tiersQ = useQuery({
    queryKey: ["portal-perf-tiers"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("bonus_tiers")
          .select("id, tier_name, target_amount, bonus_amount")
          .eq("active", true)
          .order("target_amount", { ascending: true });
        if (error) throw error;
        return (data ?? []) as Tier[];
      } catch (e) {
        console.warn("[PerformanceCard] tiers error", e);
        return [] as Tier[];
      }
    },
  });

  const current = Number(totalQ.data ?? 0);
  const tiers = tiersQ.data ?? [];

  const { nextTier, prevTierAmount, progressPct, achieved } = useMemo(() => {
    if (tiers.length === 0) {
      return { nextTier: null as Tier | null, prevTierAmount: 0, progressPct: 0, achieved: [] as Tier[] };
    }
    const achieved = tiers.filter((t) => current >= Number(t.target_amount));
    const next = tiers.find((t) => current < Number(t.target_amount)) ?? null;
    const maxTarget = Number(tiers[tiers.length - 1].target_amount) || 1;
    const pct = Math.min(100, Math.max(0, (current / maxTarget) * 100));
    const prevAmt = achieved.length > 0 ? Number(achieved[achieved.length - 1].target_amount) : 0;
    return { nextTier: next, prevTierAmount: prevAmt, progressPct: pct, achieved };
  }, [tiers, current]);

  const distance = nextTier ? Math.max(0, Number(nextTier.target_amount) - current) : 0;

  return (
    <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-100 grid place-items-center text-amber-700">
          <Trophy className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-brand-dark">Năng suất tháng</h3>
          <p className="text-xs text-ink-muted">Hoa hồng tích luỹ trong tháng hiện tại.</p>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-brand-soft to-white border border-hairline p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-ink-muted font-bold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Doanh số hiện tại
            </div>
            <div className="text-3xl font-black text-brand-dark mt-1">
              {totalQ.isLoading ? "…" : money(current)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-widest text-ink-muted font-bold">Mốc đạt được</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {achieved.length}/{tiers.length}
            </div>
          </div>
        </div>
      </div>

      {/* Thanh tiến trình nhiều mốc */}
      <div className="mt-5">
        {tiers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline p-4 text-center text-xs text-ink-muted italic">
            Chưa có cấu hình mốc thưởng.
          </div>
        ) : (
          <>
            <div className="relative h-3 rounded-full bg-slate-100 overflow-visible">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-brand to-emerald-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
              {tiers.map((t, i) => {
                const maxTarget = Number(tiers[tiers.length - 1].target_amount) || 1;
                const pos = Math.min(100, (Number(t.target_amount) / maxTarget) * 100);
                const done = current >= Number(t.target_amount);
                return (
                  <div
                    key={t.id}
                    className="absolute -top-1"
                    style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
                  >
                    <div
                      className={
                        "w-5 h-5 rounded-full border-2 grid place-items-center shadow-sm " +
                        (done
                          ? "bg-emerald-500 border-white text-white"
                          : "bg-white border-slate-300 text-slate-400")
                      }
                      title={t.tier_name}
                    >
                      <span className="text-[9px] font-black">{i + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Labels dưới */}
            <div className="flex justify-between mt-4 gap-1 text-[10px] text-ink-muted">
              {tiers.map((t) => (
                <div key={t.id} className="flex-1 text-center">
                  <div className="font-bold text-ink truncate">{t.tier_name}</div>
                  <div>{money(Number(t.target_amount))}</div>
                  <div className="text-emerald-700 font-bold">+{money(Number(t.bonus_amount))}</div>
                </div>
              ))}
            </div>

            {/* Text khích lệ */}
            <div className="mt-4 rounded-xl bg-brand-soft/70 border border-hairline p-3 flex items-start gap-2">
              <Target className="w-4 h-4 text-brand-dark shrink-0 mt-0.5" />
              <div className="text-sm text-brand-dark">
                {nextTier ? (
                  <>
                    Cố lên! Bạn còn cách mốc <b>{nextTier.tier_name}</b> (thưởng{" "}
                    <b>{money(Number(nextTier.bonus_amount))}</b>){" "}
                    <b>{money(distance)}</b> nữa.
                  </>
                ) : (
                  <>🎉 Xuất sắc! Bạn đã chinh phục tất cả các mốc thưởng của tháng này.</>
                )}
                {prevTierAmount > 0 && nextTier && (
                  <div className="text-[11px] text-ink-muted mt-1">
                    Vừa vượt mốc {money(prevTierAmount)}. Tiếp tục phát huy nhé!
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
