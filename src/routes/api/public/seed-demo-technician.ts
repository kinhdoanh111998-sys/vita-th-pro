import { createFileRoute } from "@tanstack/react-router";

/**
 * Idempotent seed:
 *   - ktv@vitath.pro / 12345678  → technician
 *   - Đăng ký + duyệt Ca sáng & Ca chiều cho HÔM NAY (Asia/Ho_Chi_Minh)
 *   - Check-in 08:00 sáng nay (chưa check-out)
 */
export const Route = createFileRoute("/api/public/seed-demo-technician")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const email = "ktv@vitath.pro";
        const password = "12345678";
        const full_name = "Kỹ Thuật Viên Demo";

        // 1) Auth user
        const existing = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        let uid = existing.data?.id as string | undefined;
        if (!uid) {
          const created = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name },
          });
          if (created.error) {
            return new Response(
              JSON.stringify({ error: created.error.message }),
              { status: 500, headers: { "content-type": "application/json" } },
            );
          }
          uid = created.data.user?.id;
        }
        if (!uid) {
          return new Response(JSON.stringify({ error: "no uid" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        // 2) public.users + user_roles
        await supabaseAdmin.from("users").upsert(
          { id: uid, email, full_name, role: "technician" },
          { onConflict: "id" },
        );
        // enum app_role không có 'technician' → dùng 'staff' cho RBAC
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: uid, role: "staff" },
          { onConflict: "user_id,role" },
        );

        // 3) Ngày hôm nay theo VN
        const today = new Date(
          new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }),
        )
          .toISOString()
          .slice(0, 10);

        // Lấy 2 ca
        const shifts = await supabaseAdmin
          .from("shifts")
          .select("id,name,start_time,end_time");
        const shiftRows = shifts.data ?? [];
        const morning = shiftRows.find((s) =>
          (s.name as string).toLowerCase().includes("sáng"),
        );
        const afternoon = shiftRows.find((s) =>
          (s.name as string).toLowerCase().includes("chiều"),
        );

        const regs: Array<Record<string, unknown>> = [];
        for (const s of [morning, afternoon]) {
          if (!s) continue;
          regs.push({
            employee_id: uid,
            shift_id: s.id,
            date: today,
            status: "approved",
          });
        }
        if (regs.length) {
          await supabaseAdmin
            .from("shift_registrations")
            .upsert(regs, { onConflict: "employee_id,shift_id,date" });
        }

        // 4) Check-in 08:00 sáng nay (VN → UTC)
        // 08:00 VN = 01:00 UTC
        const checkInUTC = `${today}T01:00:00.000Z`;

        const existingAtt = await supabaseAdmin
          .from("attendances")
          .select("id")
          .eq("employee_id", uid)
          .eq("date", today)
          .maybeSingle();

        if (!existingAtt.data) {
          await supabaseAdmin.from("attendances").insert({
            employee_id: uid,
            date: today,
            shift_id: morning?.id ?? null,
            check_in_time: checkInUTC,
            check_in_approved: true,
            check_out_time: null,
          });
        } else {
          await supabaseAdmin
            .from("attendances")
            .update({
              check_in_time: checkInUTC,
              check_in_approved: true,
              check_out_time: null,
              shift_id: morning?.id ?? null,
            })
            .eq("id", existingAtt.data.id);
        }

        return new Response(
          JSON.stringify(
            {
              ok: true,
              uid,
              date: today,
              shifts_registered: regs.length,
              email,
              password,
            },
            null,
            2,
          ),
          { headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
