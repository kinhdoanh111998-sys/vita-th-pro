import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/admin/commissions")({
  component: CommissionsAdmin,
});

type Commission = {
  id: string;
  staff_id: string | null;
  commission_type: string | null;
  amount: number | null;
  status: string | null;
  created_at: string | null;
};

type User = { id: string; full_name: string | null };

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function CommissionsAdmin() {
  const qc = useQueryClient();

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin", "commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Commission[];
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin", "users", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id,full_name");
      if (error) throw error;
      return (data ?? []) as User[];
    },
  });

  const nameOf = (id: string | null) =>
    users.find((u) => u.id === id)?.full_name ?? "—";

  const pendingByStaff = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      if ((r.status ?? "").toLowerCase() === "pending" && r.staff_id) {
        map.set(r.staff_id, (map.get(r.staff_id) ?? 0) + Number(r.amount ?? 0));
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("commissions").update({ status: "paid" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã đánh dấu thanh toán");
      qc.invalidateQueries({ queryKey: ["admin", "commissions"] });
    },
    onError: (e: Error) => toast.error(e.message || "Cập nhật thất bại"),
  });

  return (
    <>
      <AdminTopbar
        title="Hoa hồng / Trả thưởng"
        subtitle={isLoading ? "Đang tải..." : `${rows.length} bản ghi`}
      />

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          Lỗi tải dữ liệu: {(error as Error).message}
        </div>
      )}

      <div className="mb-5">
        <div className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">
          Tổng chưa thanh toán theo nhân viên
        </div>
        {pendingByStaff.length === 0 ? (
          <div className="text-sm text-ink-muted bg-white border border-hairline rounded-xl p-4 font-semibold">
            Không có khoản hoa hồng nào đang chờ thanh toán.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {pendingByStaff.map(([id, total]) => (
              <div
                key={id}
                className="bg-brand-lime border border-[#d6e5c9] rounded-2xl px-4 py-2.5 shadow-sm"
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#34483a]">
                  {nameOf(id)}
                </div>
                <div className="text-base font-black text-brand-dark">{formatVND(total)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr>
              {["Nhân viên", "Nguồn", "Số tiền", "Ngày tạo", "Trạng thái", "Thao tác"].map((h) => (
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
                <td colSpan={6} className="px-3.5 py-10 text-center text-ink-muted font-semibold">
                  Chưa có bản ghi hoa hồng nào.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const isPending = (r.status ?? "").toLowerCase() === "pending";
                return (
                  <tr key={r.id}>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">
                      {nameOf(r.staff_id)}
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                      {r.commission_type ?? "—"}
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-bold text-brand-dark">
                      {formatVND(Number(r.amount ?? 0))}
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          isPending
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {r.status ?? "—"}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                      {isPending && (
                        <Button
                          size="sm"
                          onClick={() => markPaid.mutate(r.id)}
                          disabled={markPaid.isPending}
                        >
                          Đã thanh toán
                        </Button>
                      )}
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
