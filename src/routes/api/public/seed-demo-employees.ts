import { createFileRoute } from "@tanstack/react-router";

/**
 * Idempotent seed endpoint used ONCE để tạo hai tài khoản demo:
 *   - ql@vitath.pro / 12345678  → manager
 *   - nv@vitath.pro / 12345678  → sale (staff)
 * An toàn để gọi lại: nếu tài khoản đã tồn tại thì bỏ qua.
 */
export const Route = createFileRoute("/api/public/seed-demo-employees")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );

        type Seed = {
          email: string;
          password: string;
          full_name: string;
          role: "manager" | "sale";
          appRole: "manager" | "staff";
        };
        const seeds: Seed[] = [
          {
            email: "ql@vitath.pro",
            password: "12345678",
            full_name: "Quản Lý Demo",
            role: "manager",
            appRole: "manager",
          },
          {
            email: "nv@vitath.pro",
            password: "12345678",
            full_name: "Nhân Viên Demo",
            role: "sale",
            appRole: "staff",
          },
        ];

        const results: Array<Record<string, unknown>> = [];

        for (const s of seeds) {
          // Tìm xem đã tồn tại chưa (dựa vào public.users theo email).
          const existing = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", s.email)
            .maybeSingle();

          let uid = existing.data?.id as string | undefined;

          if (!uid) {
            const created = await supabaseAdmin.auth.admin.createUser({
              email: s.email,
              password: s.password,
              email_confirm: true,
              user_metadata: { full_name: s.full_name },
            });
            if (created.error) {
              results.push({ email: s.email, status: "error", message: created.error.message });
              continue;
            }
            uid = created.data.user?.id;
          }

          if (!uid) {
            results.push({ email: s.email, status: "error", message: "Không lấy được id" });
            continue;
          }

          await supabaseAdmin.from("users").upsert(
            { id: uid, email: s.email, full_name: s.full_name, role: s.role },
            { onConflict: "id" },
          );
          await supabaseAdmin.from("user_roles").upsert(
            { user_id: uid, role: s.appRole },
            { onConflict: "user_id,role" },
          );

          results.push({ email: s.email, status: "ok", id: uid });
        }

        return new Response(JSON.stringify({ results }, null, 2), {
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
