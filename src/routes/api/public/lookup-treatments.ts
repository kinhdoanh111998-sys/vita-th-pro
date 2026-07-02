import { createFileRoute } from "@tanstack/react-router";

// Tra cứu liệu trình theo SĐT — public endpoint (bảng customers/treatments RLS
// không cho anon đọc). Chỉ trả về các trường an toàn.
export const Route = createFileRoute("/api/public/lookup-treatments")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { phone?: string };
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "Bad JSON" }, { status: 400 });
        }
        const phone = String(body.phone ?? "").trim();
        if (!phone) {
          return Response.json({ error: "Thiếu SĐT" }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: cust, error: cErr } = await supabaseAdmin
          .from("customers")
          .select("id, name, full_name")
          .eq("phone", phone)
          .maybeSingle();
        if (cErr) return Response.json({ error: cErr.message }, { status: 500 });
        if (!cust) {
          return Response.json({ customer: null, packages: [] });
        }

        // Join treatments → orders → services (tên gói, số buổi mặc định).
        const { data: tts, error: tErr } = await supabaseAdmin
          .from("treatments")
          .select("id, order_id, session_number, status, created_at, orders(service_id, quantity, services(name, default_sessions))")
          .eq("customer_id", cust.id)
          .order("created_at", { ascending: true });
        if (tErr) return Response.json({ error: tErr.message }, { status: 500 });

        // Gom theo order_id.
        type Row = {
          id: string;
          order_id: string | null;
          session_number: number | null;
          status: string | null;
          orders: {
            quantity: number | null;
            services: { name: string | null; default_sessions: number | null } | null;
          } | null;
        };
        const groups = new Map<string, {
          order_id: string;
          package_name: string;
          total_sessions: number;
          used_sessions: number;
          sessions: Array<{ session_number: number | null; status: string | null }>;
        }>();

        for (const r of (tts ?? []) as unknown as Row[]) {
          const key = r.order_id ?? "unknown";
          const svc = r.orders?.services;
          const perOrderTotal =
            (r.orders?.quantity ?? 1) * Math.max(svc?.default_sessions ?? 1, 1);
          const g = groups.get(key) ?? {
            order_id: key,
            package_name: svc?.name ?? "Liệu trình",
            total_sessions: perOrderTotal,
            used_sessions: 0,
            sessions: [],
          };
          g.sessions.push({ session_number: r.session_number, status: r.status });
          if (r.status === "done" || r.status === "completed") g.used_sessions += 1;
          groups.set(key, g);
        }

        const packages = Array.from(groups.values()).map((g) => ({
          ...g,
          remaining_sessions: Math.max(g.total_sessions - g.used_sessions, 0),
        }));

        return Response.json({
          customer: { name: cust.full_name ?? cust.name ?? null },
          packages,
        });
      },
    },
  },
});
