import { createServerFn } from "@tanstack/react-start";
import { ZALO_STATE_COOKIE, ZALO_VERIFIER_COOKIE, CUSTOMER_EMAIL_DOMAIN } from "./zalo-auth.constants";

type ExchangeInput = {
  code: string;
  state: string;
};

type ExchangeResult =
  | { ok: true; email: string; password: string }
  | { ok: false; error: "phone_required" | "invalid_state" | "zalo_error" | "server_error"; message?: string };

export const zaloExchangeAndSignIn = createServerFn({ method: "POST" })
  .inputValidator((data: ExchangeInput) => {
    if (!data || typeof data.code !== "string" || typeof data.state !== "string") {
      throw new Error("invalid_input");
    }
    return { code: data.code, state: data.state };
  })
  .handler(async ({ data }): Promise<ExchangeResult> => {
    try {
      const { getCookie, deleteCookie } = await import("@tanstack/react-start/server");
      const appId = process.env.ZALO_APP_ID;
      const appSecret = process.env.ZALO_APP_SECRET;
      if (!appId || !appSecret) {
        console.error("[zalo] missing ZALO_APP_ID / ZALO_APP_SECRET");
        return { ok: false, error: "server_error", message: "Chưa cấu hình Zalo App ID/Secret" };
      }

      // Verify state
      const savedState = getCookie(ZALO_STATE_COOKIE);
      const codeVerifier = getCookie(ZALO_VERIFIER_COOKIE);
      if (!savedState || !codeVerifier || savedState !== data.state) {
        return { ok: false, error: "invalid_state", message: "Phiên đăng nhập Zalo không hợp lệ, vui lòng thử lại" };
      }

      // One-time use — clear cookies immediately
      try {
        deleteCookie(ZALO_STATE_COOKIE);
        deleteCookie(ZALO_VERIFIER_COOKIE);
      } catch {
        /* ignore */
      }

      const { exchangeZaloCode, fetchZaloMe, normalizeVNPhone } = await import("./zalo-auth.server");

      const token = await exchangeZaloCode({
        code: data.code,
        codeVerifier,
        appId,
        appSecret,
      });
      if (!token.access_token) {
        console.error("[zalo] token exchange failed:", token);
        return { ok: false, error: "zalo_error", message: token.error_description || "Không lấy được token Zalo" };
      }

      const me = await fetchZaloMe(token.access_token);
      if (!me.id) {
        console.error("[zalo] /me failed:", me);
        return { ok: false, error: "zalo_error", message: me.message || "Không lấy được thông tin Zalo" };
      }

      const phone = normalizeVNPhone(me.phone);
      if (!phone) {
        return { ok: false, error: "phone_required" };
      }

      const fullName = (me.name || "").trim() || `Khách ${phone.slice(-4)}`;
      const avatarUrl = me.picture?.data?.url ?? null;
      const email = `${phone}${CUSTOMER_EMAIL_DOMAIN}`;
      const password = phone; // Per business rule: mk = SĐT

      // Admin operations
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      // Find existing auth user by email
      let userId: string | null = null;
      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (listErr) {
        console.error("[zalo] listUsers error:", listErr);
      } else {
        const found = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
        if (found) userId = found.id;
      }

      if (!userId) {
        // Create new auth user
        const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName, provider: "zalo", zalo_id: me.id },
        });
        if (createErr || !created?.user) {
          console.error("[zalo] createUser error:", createErr);
          return { ok: false, error: "server_error", message: "Không tạo được tài khoản" };
        }
        userId = created.user.id;

        // users row
        const { error: uErr } = await supabaseAdmin.from("users").insert({
          id: userId,
          email,
          full_name: fullName,
          role: "customer",
        });
        if (uErr) console.error("[zalo] insert users error:", uErr);

        // customers row
        const { error: cErr } = await supabaseAdmin.from("customers").insert({
          id: userId,
          email,
          phone,
          name: fullName,
          full_name: fullName,
          avatar_url: avatarUrl,
          zalo_id: me.id,
        });
        if (cErr) console.error("[zalo] insert customers error:", cErr);
      } else {
        // Refresh password (in case user changed it — force back to phone per rule)
        // and update profile with latest Zalo data.
        try {
          await supabaseAdmin.auth.admin.updateUserById(userId, { password });
        } catch (e) {
          console.error("[zalo] updateUserById password error:", e);
        }
        const { error: upErr } = await supabaseAdmin
          .from("customers")
          .update({
            name: fullName,
            full_name: fullName,
            avatar_url: avatarUrl,
            zalo_id: me.id,
            phone,
          })
          .eq("id", userId);
        if (upErr) console.error("[zalo] update customers error:", upErr);
      }

      return { ok: true, email, password };
    } catch (err) {
      console.error("[zalo] handler crashed:", err);
      return { ok: false, error: "server_error", message: (err as Error)?.message ?? "Lỗi máy chủ" };
    }
  });
