import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminTopbar } from "@/components/AdminTopbar";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/admin/treatments")({
  component: TreatmentsAdmin,
});

type Treatment = {
  id: string;
  customer_id: string | null;
  package_name: string | null;
  total_sessions: number | null;
  used_sessions: number | null;
  remaining_sessions: number | null;
  status: string | null;
  created_at: string | null;
};

type Customer = { id: string; name: string | null };

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-rose-100 text-rose-800",
};

function TreatmentsAdmin() {
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin", "treatments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Treatment[];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["admin", "customers", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("id,name");
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });

  const nameOf = (id: string | null) =>
    customers.find((c) => c.id === id)?.name ?? "—";

  return (
    <>
      <AdminTopbar
        title="Liệu trình khách hàng"
        subtitle={isLoading ? "Đang tải..." : `${rows.length} liệu trình`}
      />

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          Lỗi tải dữ liệu: {(error as Error).message}
        </div>
      )}

      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              {["Khách hàng", "Tên gói", "Tiến độ", "Trạng thái", "Ngày tạo"].map((h) => (
                <th
                  key={h}
                  className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={5} className="px-3.5 py-10 text-center text-ink-muted font-semibold">
                  Chưa có liệu trình nào.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const used = r.used_sessions ?? 0;
                const total = r.total_sessions ?? 0;
                const remaining = r.remaining_sessions ?? Math.max(total - used, 0);
                return (
                  <tr key={r.id}>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">
                      {nameOf(r.customer_id)}
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                      {r.package_name ?? "—"}
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                      Đã dùng <b>{used}</b> / Tổng <b>{total}</b> buổi (Còn lại{" "}
                      <b className="text-brand-dark">{remaining}</b>)
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          STATUS_STYLES[r.status ?? ""] ?? "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {r.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("vi-VN") : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
