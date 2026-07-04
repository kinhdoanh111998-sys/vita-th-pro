import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { zaloExchangeAndSignIn } from "@/lib/zalo-auth.functions";
import { ZALO_AUTHORIZE_PATH } from "@/lib/zalo-auth.constants";
import { getStoredRef, clearRef } from "@/lib/refTracker";


type ZaloCallbackSearch = {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
};

export const Route = createFileRoute("/auth/zalo/callback")({
  validateSearch: (search: Record<string, unknown>): ZaloCallbackSearch => ({
    code: typeof search.code === "string" ? search.code : undefined,
    state: typeof search.state === "string" ? search.state : undefined,
    error: typeof search.error === "string" ? search.error : undefined,
    error_description:
      typeof search.error_description === "string" ? search.error_description : undefined,
  }),
  component: ZaloCallbackPage,
});

function ZaloCallbackPage() {
  const search = useSearch({ from: "/auth/zalo/callback" });
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang đăng nhập bằng Zalo...");
  const [loading, setLoading] = useState(true);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      try {
        if (search.error) {
          const zaloError = search.error_description || search.error;
          const msg = `Zalo trả về lỗi: ${zaloError}`;
          setMessage(msg);
          toast.error(msg);
          setTimeout(() => navigate({ to: "/login", replace: true }), 3000);
          return;
        }
        if (!search.code || !search.state) {
          const msg = `Thiếu tham số từ Zalo (code=${search.code ?? "null"}, state=${search.state ?? "null"})`;
          setMessage(msg);
          toast.error(msg);
          setTimeout(() => navigate({ to: "/login", replace: true }), 3000);
          return;
        }

        const refCode = getStoredRef() ?? undefined;
        const result = await zaloExchangeAndSignIn({
          data: { code: search.code, state: search.state, refCode },
        });


        if (!result.ok) {
          if (result.error === "phone_required") {
            setMessage("Bạn cần đồng ý chia sẻ số điện thoại. Đang mở lại Zalo...");
            toast.error("Vui lòng đồng ý chia sẻ số điện thoại để đăng nhập");
            setTimeout(() => {
              window.location.href = ZALO_AUTHORIZE_PATH;
            }, 1800);
            return;
          }
          const detail = result.message || result.error || "unknown_error";
          const msg = `Lỗi backend Zalo [${result.error}]: ${detail}`;
          setMessage(msg);
          toast.error(msg);
          setTimeout(() => navigate({ to: "/login", replace: true }), 3500);
          return;
        }

        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: result.email,
          password: result.password,
        });
        if (signInErr) {
          console.error("[zalo/callback] signIn error:", signInErr);
          const msg = `Lỗi tạo phiên đăng nhập: ${signInErr.message} (code=${signInErr.code ?? "n/a"}, status=${signInErr.status ?? "n/a"})`;
          setMessage(msg);
          toast.error(msg);
          setTimeout(() => navigate({ to: "/login", replace: true }), 3500);
          return;
        }

        try { clearRef(); } catch { /* ignore */ }
        toast.success("Đăng nhập thành công qua Zalo!");
        navigate({ to: "/app", replace: true });
      } catch (err) {
        console.error("[zalo/callback] crash:", err);
        const msg = `Exception khi đăng nhập Zalo: ${(err as Error)?.message ?? String(err)}`;
        setMessage(msg);
        toast.error(msg);
        setTimeout(() => navigate({ to: "/login", replace: true }), 3500);
      } finally {
        setLoading(false);
      }
    })();
  }, [search, navigate]);

  return (
    <div className="min-h-screen bg-[#f3f7f3] flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-white border border-hairline rounded-2xl p-8 shadow-sm text-center">
        {loading && (
          <Loader2 className="mx-auto animate-spin text-[#0068FF] mb-4" size={40} />
        )}
        <p className="text-brand-dark font-bold">{message}</p>
        <p className="text-sm text-ink-muted mt-2">Vui lòng đợi trong giây lát...</p>
      </div>
    </div>
  );
}
