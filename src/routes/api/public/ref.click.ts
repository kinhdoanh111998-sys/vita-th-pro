import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const bodySchema = z.object({
  ref_code: z.string().trim().min(3).max(16),
  landing_path: z.string().trim().max(500).optional(),
  session_id: z.string().trim().max(100).optional(),
});

export const Route = createFileRoute("/api/public/ref/click")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const parsed = bodySchema.safeParse(body);
          if (!parsed.success) {
            return new Response("Invalid input", { status: 400 });
          }
          const { ref_code, landing_path, session_id } = parsed.data;
          const ua = request.headers.get("user-agent")?.slice(0, 500) ?? null;
          const xff = request.headers.get("x-forwarded-for") ?? "";
          const ip = xff.split(",")[0]?.trim() || null;

          // Hash IP for privacy
          let ipHash: string | null = null;
          if (ip) {
            const enc = new TextEncoder().encode(ip + "|vitath-ref");
            const buf = await crypto.subtle.digest("SHA-256", enc);
            ipHash = Array.from(new Uint8Array(buf))
              .slice(0, 8)
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("referral_clicks").insert({
            ref_code: ref_code.toUpperCase(),
            landing_path: landing_path ?? null,
            ip_hash: ipHash,
            user_agent: ua,
            session_id: session_id ?? null,
          });

          return new Response("ok", { status: 200 });
        } catch (err) {
          console.error("[ref/click] error:", err);
          return new Response("Server error", { status: 500 });
        }
      },
    },
  },
});
