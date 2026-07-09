import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, TrendingUp, Target, Flame } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { DEFAULT_PAYROLL_SETTINGS, formatVND } from "@/lib/payroll";

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

  // Lấy Cấu hình Lương từ Database (nếu không có thì dùng DEFAULT_PAYROLL_SETTINGS từ payroll.ts)
  const settingsQ = useQuery({
    queryKey: ["payroll-settings-global"],
    queryFn: async () => {
      const { data } = await supabase.from("payroll_settings").select("*").single();
      return data ? { ...DEFAULT_PAYROLL_SETTINGS, ...data } : DEFAULT_PAYROLL_SETTINGS;
    }
  });

  const settings = settingsQ.data ?? DEFAULT_PAYROLL_SETTINGS;
  const tiers = [...settings.sales_commission_tiers].sort((a, b) => a.min - b.min);

  // Truy vấn Doanh số Sản phẩm tháng này
  const productRevenueQ = useQuery({
    queryKey: ["portal-product-revenue", uid, startISO],
    enabled: !!uid,
    queryFn: async () => {
      // NOTE: Đang Query mẫu từ bảng orders (Bạn có thể điều chỉnh tên cột nếu DB lưu khác)
      const { data, error } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("created_by", uid!) // Hoặc staff_id tùy schema của bạn
        .eq("status", "paid")
        .gte("created_at", startISO)
        .lt("created_at", endISO);
      
      const sum = (data ?? []).reduce((acc, row) => acc + Number(row.total_amount || 0), 0);
      return sum;
    },
  });

  // Lịch sử nhận Thưởng nóng trong tháng
  const hotBonusHistoryQ = useQuery({
    queryKey: ["portal-hot-bonus-history", uid, startISO],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("id, amount, note, created_at")
        .eq("staff_id", uid!)
        .eq("commission_type", "hot_bonus") // Cột phân loại thưởng nóng
        .gte("created_at", startISO)
        .order("created_at", { ascending: false });
      return data ?? [];
    }
  });

  const currentRevenue = Number(productRevenueQ.data ?? 0);
  const hotBonuses = hotBonusHistoryQ.data ?? [];

  // Tính toán Tiến trình Gameification
  const { nextTier, progressPct, achieved } = useMemo(() => {
    if (tiers.length === 0) return { nextTier: null, progressPct: 0, achieved: [] };
    
    const achieved = tiers.filter((t) => currentRevenue >= t.min);
    const next = tiers.find((t) => currentRevenue < t.min) ?? null;
    const maxTarget = tiers[tiers.length - 1].min || 1;
    const pct = Math.min(100, Math.max(0, (currentRevenue / maxTarget) * 100));
    
    return { nextTier: next, progressPct: pct, achieved };
  }, [tiers, currentRevenue]);

  const currentPercent = achieved.length > 0 ? achieved[achieved.length - 1].percent : 0;
  const distance = nextTier ? Math.max(0, nextTier.min - currentRevenue) : 0;

  return (
    <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-100 grid place-items-center text-amber-700">
          <Trophy className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-brand-dark">Hoa hồng Bán hàng</h3>
          <p className="text-xs text-ink-muted">Doanh số sản phẩm tích lũy tháng này.</p>
        </div>
      </div>

      <div className="rounded-xl bg-gradient-to-br from-brand-soft to-white border border-hairline p-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-ink-muted font-bold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Doanh số hiện tại
            </div>
            <div className="text-3xl font-black text-brand-dark mt-1">
              {productRevenueQ.isLoading ? "…" : formatVND(currentRevenue)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-widest text-ink-muted font-bold">Mức Hoa hồng</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {currentPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Thanh tiến trình */}
      <div className="mt-6">
        <div className="relative h-3 rounded-full bg-slate-100 overflow-visible">
          <div className="h-3 rounded-full bg-gradient-to-r from-brand to-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
          {tiers.map((t, i) => {
            const maxTarget = tiers[tiers.length - 1].min || 1;
            const pos = Math.min(100, (t.min / maxTarget) * 100);
            const done = currentRevenue >= t.min;
            return (
              <div key={i} className="absolute -top-1.5" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
                <div className={`w-6 h-6 rounded-full border-2 grid place-items-center shadow-sm ${done ? "bg-emerald-500 border-white text-white" : "bg-white border-slate-300 text-slate-400"}`} title={`Mốc ${formatVND(t.min)}`}>
                  <span className="text-[9px] font-black">{t.percent}%</span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Labels dưới */}
        <div className="flex justify-between mt-4 gap-1 text-[10px] text-ink-muted">
          {tiers.map((t, i) => (
            <div key={i} className="flex-1 text-center">
              <div>{formatVND(t.min)}</div>
            </div>
          ))}
        </div>

        {/* Text khích lệ */}
        <div className="mt-4 rounded-xl bg-brand-soft/70 border border-hairline p-3 flex items-start gap-2">
          <Target className="w-4 h-4 text-brand-dark shrink-0 mt-0.5" />
          <div className="text-sm text-brand-dark">
            {nextTier ? (
              <>Cố lên! Cần bán thêm <b>{formatVND(distance)}</b> nữa để nâng mức hoa hồng lên <b>{nextTier.percent}%</b>.</>
            ) : (
              <>🎉 Xuất sắc! Bạn đã chạm mốc hoa hồng cao nhất ({currentPercent}%).</>
            )}
          </div>
        </div>
      </div>

      {/* Lịch sử Thưởng nóng */}
      <div className="mt-6 pt-5 border-t border-hairline">
        <div className="text-[11px] uppercase tracking-widest text-ink-muted font-bold mb-3 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-orange-500" /> Thưởng nóng đơn ≥ {formatVND(settings.hot_bonus_threshold)}
        </div>
        {hotBonuses.length === 0 ? (
           <div className="text-xs text-ink-muted italic bg-slate-50 p-3 rounded-lg border border-dashed text-center">Chưa có khoản thưởng nóng nào tháng này.</div>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {hotBonuses.map(hb => (
              <div key={hb.id} className="flex justify-between items-center bg-orange-50 border border-orange-100 p-2.5 rounded-lg">
                <div>
                  <div className="text-xs font-bold text-orange-900">{hb.note || "Thưởng nóng doanh số"}</div>
                  <div className="text-[10px] text-orange-700 mt-0.5">{new Date(hb.created_at).toLocaleDateString('vi-VN')}</div>
                </div>
                <div className="text-sm font-black text-orange-600">+{formatVND(hb.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
