import { createFileRoute } from "@tanstack/react-router";
import { setCookie } from "@tanstack/react-start/server";

export const Route = createFileRoute("/api/public/zalo/authorize")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const appId = process.env.ZALO_APP_ID;
          if (!appId) {
            return new Response("Chưa cấu hình ZALO_APP_ID", { status: 500 });
          }

          const {
            generateCodeVerifier,
            generateState,
            codeChallengeFromVerifier,
          } = await import("@/lib/zalo-auth.server");
          const { ZALO_STATE_COOKIE, ZALO_VERIFIER_COOKIE } = await import("@/lib/zalo-auth.constants");

          const state = generateState();
          const verifier = generateCodeVerifier();
          const challenge = codeChallengeFromVerifier(verifier);

          const origin = new URL(request.url).origin;
          const redirectUri = `${origin}/auth/zalo/callback`;

          // httpOnly cookies, 5 minutes lifetime
          const cookieOpts = {
            httpOnly: true,
            secure: origin.startsWith("https://"),
            sameSite: "lax" as const,
            path: "/",
            maxAge: 60 * 5,
          };
          setCookie(ZALO_STATE_COOKIE, state, cookieOpts);
          setCookie(ZALO_VERIFIER_COOKIE, verifier, cookieOpts);

          const params = new URLSearchParams({
            app_id: appId,
            redirect_uri: redirectUri,
            code_challenge: challenge,
            state,
          });
          const url = `https://oauth.zaloapp.com/v4/permission?${params.toString()}`;

          return new Response(null, {
            status: 302,
            headers: { Location: url },
          });
        } catch (err) {
          console.error("[zalo/authorize] error:", err);
          return new Response("Lỗi khởi tạo đăng nhập Zalo", { status: 500 });
        }
      },
    },
  },
});
