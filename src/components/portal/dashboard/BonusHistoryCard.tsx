import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { formatVND } from "@/lib/payroll";

const TYPE_LABEL: Record<string, string> = {
  service: "HH Dịch vụ",
  tour_service: "HH Dịch vụ",
  sale: "HH Bán hàng",
  product: "HH Sản phẩm",
  affiliate_order: "HH Giới thiệu",
  bonus: "Thưởng",
  hot: "Thưởng nóng",
};

export function BonusHistoryCard() {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;

  const q = useQuery({
    queryKey: ["portal-bonus-history", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("id, amount, status, commission_type, note, created_at, paid_at")
        .eq("staff_id", uid!)
        .order("created_at", { ascending: false })
        .limit(15);
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = q.data ?? [];

  return (
    <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-fuchsia-100 grid place-items-center text-fuchsia-700">
          <Award className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-brand-dark">Lịch sử thưởng & hoa hồng</h3>
          <p className="text-xs text-ink-muted">15 khoản gần nhất.</p>
        </div>
      </div>

      {q.isLoading ? (
        <div className="text-xs text-ink-muted italic">Đang tải…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline p-6 text-center text-xs text-ink-muted italic">
          Chưa có khoản thưởng nào.
        </div>
      ) : (
        <ul className="divide-y divide-hairline">
          {rows.map((r) => {
            const paid = r.status === "paid";
            return (
              <li key={r.id} className="py-2 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink truncate">
                    {TYPE_LABEL[r.commission_type ?? ""] ?? r.commission_type ?? "Thưởng"}
                  </div>
                  <div className="text-[11px] text-ink-muted truncate">
                    {r.note ?? new Date(r.created_at).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-brand-dark">
                    {formatVND(Number(r.amount ?? 0))}
                  </div>
                  <span
                    className={
                      "text-[10px] px-2 py-0.5 rounded-full font-bold " +
                      (paid
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800")
                    }
                  >
                    {paid ? "Đã trả" : "Chờ duyệt"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
