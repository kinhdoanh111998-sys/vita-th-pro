import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Calendar, ShoppingBag, Users, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { supabase } from "@/lib/supabaseClient";
import { useAuth, type Role } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/notifications")({
  component: NotificationsPage,
});

type NotificationRow = {
  id: string;
  recipient_id: string | null;
  type: string | null;
  title: string | null;
  body: string | null;
  ref_type: string | null;
  ref_id: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

export function resolveNotificationRoute(n: Pick<NotificationRow, "type" | "ref_type" | "ref_id">, role: Role): string {
  const t = (n.type ?? n.ref_type ?? "").toLowerCase();
  const isStaff = role === "staff" || role === "employee" || role === "sale" || role === "technician";
  const isAdmin = role === "admin" || role === "manager";

  if (t.includes("tour")) {
    if (isStaff) return "/portal/bookings";
    if (isAdmin) return "/admin/tours";
  }
  if (t.includes("booking")) {
    if (isStaff) return "/portal/bookings";
    if (isAdmin) return "/admin/bookings";
  }
  if (t.includes("shift") || t.includes("attendance")) {
    if (isAdmin) return "/admin/shifts";
    if (isStaff) return "/portal/dashboard";
  }
  if (t.includes("order") || t.includes("payment")) {
    if (isAdmin) return "/admin/orders";
    return "/app/account";
  }
  if (t.includes("treatment") || t.includes("qr")) {
    return "/app/account";
  }
  if (t.includes("referral") || t.includes("affiliate") || t.includes("commission")) {
    if (isStaff) return "/portal/dashboard";
    return "/app/account";
  }
  return isAdmin ? "/admin" : isStaff ? "/portal/dashboard" : "/app/account";
}

function iconForType(type: string | null) {
  const t = (type ?? "").toLowerCase();
  if (t.includes("tour") || t.includes("booking")) return Calendar;
  if (t.includes("order") || t.includes("payment")) return ShoppingBag;
  if (t.includes("referral") || t.includes("affiliate") || t.includes("commission")) return Users;
  if (t.includes("treatment") || t.includes("qr")) return Sparkles;
  return Bell;
}

function NotificationsPage() {
  const { session, role } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const uid = session?.user?.id ?? null;

  const notifQ = useQuery({
    queryKey: ["notifications", uid],
    enabled: !!uid,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("id, recipient_id, type, title, body, ref_type, ref_id, is_read, created_at")
          .eq("recipient_id", uid!)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return (data ?? []) as NotificationRow[];
      } catch (e) {
        console.warn("[notifications] load error", e);
        return [] as NotificationRow[];
      }
    },
  });

  useEffect(() => {
    if (!uid) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel(`user-notif-${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `recipient_id=eq.${uid}` },
          () => qc.invalidateQueries({ queryKey: ["notifications", uid] }),
        )
        .subscribe();
    } catch (e) { console.warn("[notifications] realtime", e); }
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [uid, qc]);

  async function handleClick(n: NotificationRow) {
    if (!n.is_read) {
      try {
        await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      } catch (e) { console.warn("[notifications] mark read", e); }
    }

    const t = (n.type ?? n.ref_type ?? "").toLowerCase();
    const isAdmin = role === "admin" || role === "manager";

    // LÕI XỬ LÝ MỚI: Chỉ thông báo đơn hàng của khách hàng mới lưu tín hiệu mở Popup
    if ((t.includes("order") || t.includes("payment")) && !isAdmin) {
      if (n.ref_id) {
        sessionStorage.setItem("viewOrderId", n.ref_id); // Phát tín hiệu mở Popup
      }
      navigate({ to: "/app/account" });
      return;
    }

    // Các thông báo khác vẫn chuyển trang bình thường
    const dest = resolveNotificationRoute(n, role);
    navigate({ to: dest });
  }

  async function markAllRead() {
    if (!uid) return;
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("recipient_id", uid).eq("is_read", false);
      qc.invalidateQueries({ queryKey: ["notifications", uid] });
    } catch (e) { console.warn("[notifications] mark all", e); }
  }

  const list = notifQ.data ?? [];
  const unread = list.filter((n) => !n.is_read).length;

  return (
    <div className="px-4 py-4 md:px-0 md:py-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-brand-dark">Thông báo</h1>
          <p className="text-xs text-ink-muted">
            {unread > 0 ? `Bạn có ${unread} thông báo mới` : "Tất cả thông báo đã đọc"}
          </p>
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" /> Đánh dấu đã đọc
          </Button>
        )}
      </div>

      {notifQ.isLoading ? (
        <div className="rounded-2xl border border-hairline bg-white p-6 text-center text-sm text-ink-muted">
          Đang tải…
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-hairline bg-white p-8 text-center">
          <Bell className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <div className="font-bold text-brand-dark">Chưa có thông báo nào</div>
          <div className="text-xs text-ink-muted mt-1">Các thông báo mới sẽ hiển thị tại đây.</div>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((n) => {
            const Icon = iconForType(n.type);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleClick(n)}
                  className={
                    "w-full text-left flex gap-3 rounded-2xl border border-hairline bg-white p-4 hover:border-brand-primary hover:shadow-sm transition " +
                    (n.is_read ? "opacity-75" : "")
                  }
                >
                  <div className={"w-10 h-10 rounded-xl grid place-items-center shrink-0 " + (n.is_read ? "bg-slate-100 text-slate-500" : "bg-brand/10 text-brand-dark")}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-brand-dark truncate">{n.title ?? "Thông báo"}</div>
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />}
                    </div>
                    {n.body && <div className="text-sm text-ink-muted mt-0.5 line-clamp-2">{n.body}</div>}
                    <div className="text-[11px] text-ink-muted mt-1">
                      {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: vi }) : ""}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
