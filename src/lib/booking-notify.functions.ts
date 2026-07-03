import { createServerFn } from "@tanstack/react-start";

/**
 * Sau khi khách đặt lịch → gửi notification cho toàn bộ admin + manager,
 * đồng thời (nếu có customerUserId) gửi bản ghi confirm cho chính khách.
 * Chạy bằng supabaseAdmin vì policy notifications_insert_ops chỉ cho ops.
 */
export const notifyOpsNewBooking = createServerFn({ method: "POST" })
  .inputValidator((input: {
    bookingId: string;
    customerName: string;
    service?: string | null;
    when?: string | null;
    customerUserId?: string | null;
  }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: roleRows, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "manager"]);
    if (rErr) throw new Error(rErr.message);

    const opsRecipients = Array.from(
      new Set((roleRows ?? []).map((r) => r.user_id).filter(Boolean)),
    );

    const body = `${data.customerName}${data.service ? ` · ${data.service}` : ""}${data.when ? ` · ${data.when}` : ""}`;

    type NotifRow = {
      recipient_id: string;
      type: string;
      title: string;
      body: string;
      ref_type: string;
      ref_id: string;
    };
    const rows: NotifRow[] = opsRecipients.map((uid) => ({
      recipient_id: uid,
      type: "booking_new",
      title: "Có khách đặt lịch mới",
      body,
      ref_type: "booking",
      ref_id: data.bookingId,
    }));

    // Self notification cho khách hàng
    if (data.customerUserId) {
      rows.push({
        recipient_id: data.customerUserId,
        type: "booking_confirm",
        title: "Đặt lịch thành công",
        body: `${data.service ?? "Lịch hẹn"}${data.when ? ` · ${data.when}` : ""}. Chúng tôi sẽ liên hệ xác nhận sớm nhất.`,
        ref_type: "booking",
        ref_id: data.bookingId,
      });
    }

    if (!rows.length) return { inserted: 0 };

    const { error: iErr } = await supabaseAdmin.from("notifications").insert(rows);
    if (iErr) throw new Error(iErr.message);
    return { inserted: rows.length };
  });
