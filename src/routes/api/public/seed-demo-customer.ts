import { createFileRoute } from "@tanstack/react-router";

/**
 * Seed tài khoản khách hàng demo: kh@vitath.pro / 12345678
 */
export const Route = createFileRoute("/api/public/seed-demo-customer")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        const email = "kh@vitath.pro";
        const password = "12345678";
        const full_name = "Khách Hàng Demo";

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
              JSON.stringify({ status: "error", message: created.error.message }),
              { status: 500, headers: { "content-type": "application/json" } },
            );
          }
          uid = created.data.user?.id;
        } else {
          // Cập nhật lại mật khẩu để đảm bảo đúng 12345678
          await supabaseAdmin.auth.admin.updateUserById(uid, { password });
        }

        if (!uid) {
          return new Response(
            JSON.stringify({ status: "error", message: "Không lấy được id" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }

        await supabaseAdmin.from("users").upsert(
          { id: uid, email, full_name, role: "customer" },
          { onConflict: "id" },
        );

        // Đồng bộ hồ sơ vào bảng customers (nếu chưa có).
        await supabaseAdmin.from("customers").upsert(
          { user_id: uid, email, full_name, name: full_name },
          { onConflict: "user_id" },
        );

        return new Response(
          JSON.stringify({ status: "ok", id: uid, email }, null, 2),
          { headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
