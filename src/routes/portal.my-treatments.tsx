import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/portal/my-treatments")({
  component: MyTreatmentsPage,
});

type Treatment = {
  id: string;
  package_name: string | null;
  total_sessions: number | null;
  used_sessions: number | null;
  status: string | null;
  created_at: string | null;
};

function MyTreatmentsPage() {
  const { email, fullName } = useAuth();

  const customer = useQuery({
    queryKey: ["customer-by-email", email],
    enabled: !!email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email")
        .eq("email", email!)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; name: string | null; phone: string | null; email: string | null } | null;
    },
  });

  const customerId = customer.data?.id ?? null;

  const treatments = useQuery({
    queryKey: ["my-treatments", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("id, package_name, total_sessions, used_sessions, status, created_at")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Treatment[];
    },
  });

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-brand-dark">Liệu trình của tôi</h1>
        <p className="text-sm text-ink-muted">
          Xin chào {fullName ?? email}, đây là danh sách liệu trình bạn đang sử dụng.
        </p>
      </div>

      {customer.isLoading || treatments.isLoading ? (
        <div className="text-ink-muted">Đang tải dữ liệu...</div>
      ) : !customer.data ? (
        <div className="rounded-2xl border border-hairline bg-white p-6 text-ink-muted">
          Chưa tìm thấy hồ sơ khách hàng cho tài khoản này. Vui lòng liên hệ Spa để được liên kết tài khoản.
        </div>
      ) : (treatments.data ?? []).length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-white p-6 text-ink-muted">
          Bạn chưa có liệu trình nào.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(treatments.data ?? []).map((t) => {
            const total = Number(t.total_sessions ?? 0);
            const used = Number(t.used_sessions ?? 0);
            const remaining = Math.max(total - used, 0);
            const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
            const done = remaining === 0 && total > 0;
            return (
              <div
                key={t.id}
                className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 grid place-items-center text-brand-dark">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-ink leading-tight">
                        {t.package_name ?? "Liệu trình"}
                      </div>
                      <div className="text-[11px] uppercase tracking-wider text-ink-muted">
                        {t.status ?? "active"}
                      </div>
                    </div>
                  </div>
                  {done && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="Tổng" value={total} />
                  <Stat label="Đã dùng" value={used} />
                  <Stat label="Còn lại" value={remaining} highlight />
                </div>

                <div>
                  <Progress value={pct} className="h-2" />
                  <div className="text-[11px] text-ink-muted mt-1 text-right">{pct}%</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-2 py-2 ${highlight ? "bg-brand/10 text-brand-dark" : "bg-[#f3f7f3] text-ink"}`}>
      <div className="text-lg font-black leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
