import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/AuthContext";

export const Route = createFileRoute("/portal/bookings")({
  component: PortalBookings,
});

type Tour = {
  id: string;
  treatment_id: string | null;
  customer_id: string | null;
  technician_id: string | null;
  notes: string | null;
  status: string | null;
  staff_acceptance: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at: string | null;
  customers?: { name: string | null; phone: string | null } | null;
  treatments?: { session_number: number | null; services?: { name: string | null } | null } | null;
};

function fmtDateTime(v: string | null | undefined) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return v;
  }
}

function AcceptanceBadge({ value }: { value: string | null }) {
  if (value === "accepted")
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2.5 py-1 text-xs font-bold">
        ✓ Đã nhận ca
      </span>
    );
  if (value === "declined")
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2.5 py-1 text-xs font-bold">
        ✕ Đã từ chối
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-xs font-bold">
      ⏳ Chờ xác nhận
    </span>
  );
}

function PortalBookings() {
  const { session } = useAuth();
  const uid = session?.user?.id ?? null;
  const qc = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const toursQ = useQuery({
    queryKey: ["portal", "my-tours", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tours")
        .select(
          "id, treatment_id, customer_id, technician_id, notes, status, staff_acceptance, start_time, end_time, created_at, customers(name, phone), treatments(session_number, services(name))",
        )
        .eq("technician_id", uid!)
        .in("status", ["scheduled", "in_progress"])
        .order("start_time", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Tour[];
    },
  });

  const updateAcceptance = async (tourId: string, next: "accepted" | "declined") => {
    setPendingId(tourId);
    try {
      const { error } = await supabase
        .from("tours")
        .update({ staff_acceptance: next })
        .eq("id", tourId);
      if (error) throw error;
      toast.success(next === "accepted" ? "Đã nhận ca ✓" : "Đã từ chối ca");
      qc.invalidateQueries({ queryKey: ["portal", "my-tours", uid] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể cập nhật";
      console.error("[portal.bookings] update failed:", err);
      toast.error(msg);
    } finally {
      setPendingId(null);
    }
  };

  const rows = toursQ.data ?? [];
  const pendingCount = useMemo(
    () => rows.filter((r) => (r.staff_acceptance ?? "assigned") === "assigned").length,
    [rows],
  );

  return (
    <div className="mx-auto max-w-[1180px] space-y-4">
      <div className="bg-white border border-hairline rounded-2xl p-6">
        <h1 className="text-2xl font-black text-brand-dark">Ca làm của tôi</h1>
        <p className="text-ink-muted font-medium text-sm mt-1">
          {toursQ.isLoading
            ? "Đang tải..."
            : `${rows.length} ca đang mở${pendingCount ? ` · ${pendingCount} chờ xác nhận` : ""}.`}
        </p>
      </div>

      {toursQ.error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          {(toursQ.error as Error).message}
        </div>
      )}

      {!toursQ.isLoading && rows.length === 0 && !toursQ.error && (
        <div className="bg-white border border-hairline rounded-2xl p-10 text-center text-ink-muted font-semibold">
          Bạn chưa có ca làm nào được xếp. Khi Quản lý điều phối, ca mới sẽ hiện ở đây.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((t) => {
          const acceptance = t.staff_acceptance ?? "assigned";
          const isPending = pendingId === t.id;
          return (
            <div
              key={t.id}
              className="bg-white border border-hairline rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-black text-brand-dark truncate">
                    {t.customers?.name ?? "Khách hàng"}
                  </div>
                  <div className="text-xs text-ink-muted">{t.customers?.phone ?? "—"}</div>
                </div>
                <AcceptanceBadge value={acceptance} />
              </div>

              <div className="text-sm space-y-1">
                <div>
                  <span className="text-ink-muted">Dịch vụ: </span>
                  <span className="font-semibold">
                    {t.treatments?.services?.name ?? "—"}
                  </span>
                  {t.treatments?.session_number ? (
                    <span className="text-ink-muted"> · Buổi {t.treatments.session_number}</span>
                  ) : null}
                </div>
                <div>
                  <span className="text-ink-muted">Thời gian: </span>
                  <span className="font-semibold">{fmtDateTime(t.start_time)}</span>
                </div>
                <div>
                  <span className="text-ink-muted">Trạng thái ca: </span>
                  <span className="font-semibold">{t.status ?? "—"}</span>
                </div>
                {t.notes && (
                  <div className="text-xs text-ink-muted line-clamp-2">
                    Ghi chú: {t.notes}
                  </div>
                )}
              </div>

              {acceptance === "assigned" ? (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => updateAcceptance(t.id, "accepted")}
                  >
                    {isPending ? "..." : "Xác nhận nhận ca"}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => updateAcceptance(t.id, "declined")}
                  >
                    Từ chối
                  </Button>
                </div>
              ) : acceptance === "declined" ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => updateAcceptance(t.id, "accepted")}
                >
                  {isPending ? "..." : "Đổi ý — Nhận ca"}
                </Button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
