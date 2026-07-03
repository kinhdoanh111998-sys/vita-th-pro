import { createServerFn } from "@tanstack/react-start";

/**
 * Sau khi khách đặt lịch → gửi notification cho toàn bộ admin + manager.
 * Chạy bằng supabaseAdmin vì policy notifications_insert_ops chỉ cho ops.
 */
export const notifyOpsNewBooking = createServerFn({ method: "POST" })
  .inputValidator((input: { bookingId: string; customerName: string; service?: string | null; when?: string | null }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: roleRows, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "manager"]);
    if (rErr) throw new Error(rErr.message);

    const recipients = Array.from(new Set((roleRows ?? []).map((r) => r.user_id).filter(Boolean)));
    if (!recipients.length) return { inserted: 0 };

    const body = `${data.customerName}${data.service ? ` · ${data.service}` : ""}${data.when ? ` · ${data.when}` : ""}`;
    const rows = recipients.map((uid) => ({
      recipient_id: uid,
      type: "booking_new",
      title: "Có khách đặt lịch mới",
      body,
      ref_type: "booking",
      ref_id: data.bookingId,
    }));

    const { error: iErr } = await supabaseAdmin.from("notifications").insert(rows);
    if (iErr) throw new Error(iErr.message);
    return { inserted: rows.length };
  });
