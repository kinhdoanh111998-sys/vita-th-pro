import { createFileRoute } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import { AdminTopbar } from "@/components/AdminTopbar";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function Dashboard() {


  const results = useQueries({
    queries: [
      {
        queryKey: ["dash", "customers-count"],
        queryFn: async () => {
          const { count, error } = await supabase
            .from("customers")
            .select("*", { count: "exact", head: true });
          if (error) throw error;
          return count ?? 0;
        },
      },
      {
        queryKey: ["dash", "revenue"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("orders")
            .select("total_amount,status")
            .in("status", ["Thành công", "Đã thanh toán"]);
          if (error) throw error;
          return (data ?? []).reduce(
            (s, r: { total_amount: number | null }) => s + Number(r.total_amount ?? 0),
            0,
          );
        },
      },
      {
        queryKey: ["dash", "orders-count"],
        queryFn: async () => {
          const { count, error } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true });
          if (error) throw error;
          return count ?? 0;
        },
      },
      {
        queryKey: ["dash", "treatments-count"],
        queryFn: async () => {
          const { count, error } = await supabase
            .from("treatments")
            .select("*", { count: "exact", head: true });
          if (error) throw error;
          return count ?? 0;
        },
      },

      {
        queryKey: ["dash", "recent-bookings"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("bookings")
            .select("id,customer_name,phone,service,booking_date,booking_time,status")
            .order("created_at", { ascending: false })
            .limit(5);
          if (error) throw error;
          return data ?? [];
        },
      },
      {
        queryKey: ["dash", "recent-tours"],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("tours")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(5);
          if (error) throw error;
          return data ?? [];
        },
      },
      {
        queryKey: ["dash", "customers-all"],
        queryFn: async () => {
          const { data, error } = await supabase.from("customers").select("id,name");
          if (error) throw error;
          return (data ?? []) as { id: string; name: string | null }[];
        },
      },
      {
        queryKey: ["dash", "users-all"],
        queryFn: async () => {
          const { data, error } = await supabase.from("users").select("id,full_name");
          if (error) throw error;
          return (data ?? []) as { id: string; full_name: string | null }[];
        },
      },
    ],
  });

  const [
    qCust,
    qRev,
    qOrders,
    qTreatments,
    qBookings,
    qTours,
    qCustList,
    qUserList,
  ] = results;

  const customers = qCustList.data ?? [];
  const users = qUserList.data ?? [];
  const custName = (id: string | null) => customers.find((c) => c.id === id)?.name ?? "—";
  const userName = (id: string | null) => users.find((u) => u.id === id)?.full_name ?? "—";

  const kpis = [
    { label: "Khách hàng", value: qCust.data ?? 0, loading: qCust.isLoading, format: (v: number) => String(v) },
    { label: "Doanh thu", value: qRev.data ?? 0, loading: qRev.isLoading, format: formatVND },
    { label: "Tổng đơn hàng", value: qOrders.data ?? 0, loading: qOrders.isLoading, format: (v: number) => String(v) },
    { label: "Tổng buổi liệu trình", value: qTreatments.data ?? 0, loading: qTreatments.isLoading, format: (v: number) => String(v) },
  ];


  return (
    <>
      <AdminTopbar title="Dashboard" subtitle="Tổng quan vận hành hôm nay" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-hairline rounded-[18px] p-4">
            {k.loading ? (
              <div className="h-8 w-24 bg-slate-100 rounded animate-pulse mb-1.5" />
            ) : (
              <b className="block text-[27px] text-brand-dark">{k.format(Number(k.value))}</b>
            )}
            <span className="text-sm text-ink-muted font-bold">{k.label}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div>
          <h2 className="text-lg font-black mb-3">5 lịch hẹn gần nhất</h2>
          <MiniTable
            loading={qBookings.isLoading}
            empty="Chưa có lịch hẹn."
            head={["Khách hàng", "SĐT", "Dịch vụ", "Ngày", "Giờ", "Trạng thái"]}
            rows={(qBookings.data ?? []).map((r) => [
              r.customer_name ?? "—",
              r.phone ?? "—",
              r.service ?? "—",
              r.booking_date ?? "—",
              r.booking_time ?? "—",
              r.status ?? "—",
            ])}
          />
        </div>

        <div>
          <h2 className="text-lg font-black mb-3">5 tour mới nhất</h2>
          <MiniTable
            loading={qTours.isLoading}
            empty="Chưa có tour nào."
            head={["Khách hàng", "Kỹ thuật viên", "Ghi chú", "Ngày"]}
            rows={(qTours.data ?? []).map((r: Record<string, unknown>) => [
              custName((r.customer_id as string) ?? null),
              userName((r.technician_id as string) ?? null),
              ((r.note as string) ?? "").slice(0, 60) || "—",
              r.created_at ? new Date(r.created_at as string).toLocaleDateString("vi-VN") : "—",
            ])}
          />
        </div>
      </div>
    </>
  );
}

function MiniTable({
  head,
  rows,
  loading,
  empty,
}: {
  head: string[];
  rows: (string | number)[][];
  loading: boolean;
  empty: string;
}) {
  return (
    <div className="overflow-auto bg-white border border-hairline rounded-2xl">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="text-left px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i}>
                {head.map((_h, j) => (
                  <td key={j} className="px-3 py-2.5 border-b border-[#edf3ed]">
                    <div className="h-3 bg-slate-100 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="px-3 py-6 text-center text-ink-muted font-semibold text-sm">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className="px-3 py-2.5 text-sm border-b border-[#edf3ed]">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
