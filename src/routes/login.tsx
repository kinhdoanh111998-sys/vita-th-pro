import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/vita-th-pro-logo.png";

const VIRTUAL_CUSTOMER_DOMAIN = "@khach.vitath.pro";

function humanizeAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("database error") || m.includes("unexpected_failure") || m.includes("500")) {
    return "Hệ thống đang bảo trì, vui lòng thử lại sau";
  }
  if (m.includes("invalid login credentials") || m.includes("invalid_grant")) {
    return "Sai tài khoản hoặc mật khẩu";
  }
  if (m.includes("email not confirmed")) {
    return "Tài khoản chưa được kích hoạt";
  }
  return message;
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function destinationForRole(role: string | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "manager":
      return "/admin";
    case "employee":
    case "staff":
    case "sale":
    case "technician":
      return "/portal/dashboard";
    case "customer":
      return "/khach-hang";
    default:
      return "/";
  }
}

function resolveVirtualEmail(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("@")) return trimmed;
  return `${trimmed}@khach.vitath.pro`;
}

function LoginPage() {
  const navigate = useNavigate();
  const { session, role, loading } = useAuth();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !session) return;
    navigate({ to: destinationForRole(role), replace: true });
  }, [session, role, loading, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit(e);
    }
  };

  const onSubmit = async (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    setError(null);

    const rawInput = account.trim();
    if (!rawInput) {
      setError("Vui lòng nhập tài khoản");
      return;
    }

    setSubmitting(true);

    const finalAccount = resolveVirtualEmail(rawInput);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: finalAccount,
      password,
    });

    if (signInError || !data.user) {
      setSubmitting(false);
      const raw = signInError?.message ?? "Đăng nhập thất bại";
      const friendly = humanizeAuthError(raw);
      setError(friendly);
      toast.error(friendly);
      return;
    }

    // Fast-track: virtual customer emails skip the AuthContext role round-trip
    // entirely — no risk of infinite loading from a slow users-table read.
    const signedInEmail = (data.user.email ?? finalAccount).toLowerCase();
    if (signedInEmail.endsWith(VIRTUAL_CUSTOMER_DOMAIN)) {
      setSubmitting(false);
      navigate({ to: "/khach-hang", replace: true });
      return;
    }

    // Other roles: let AuthContext resolve, then the effect above routes.
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f3f7f3] flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white border border-hairline rounded-2xl p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <img src={logo} alt="" className="h-12 rounded-xl" />
          <div>
            <h1 className="text-xl font-black text-brand-dark">Đăng nhập</h1>
            <p className="text-sm text-ink-muted">VITA TH PRO</p>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <div>
            <label className="block text-sm font-bold mb-1">Số điện thoại hoặc Email</label>
            <Input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập số điện thoại hoặc email"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Mật khẩu</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Đang xác thực...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-hairline" />
          <span className="text-xs text-ink-muted uppercase tracking-wider">hoặc</span>
          <div className="h-px flex-1 bg-hairline" />
        </div>

        <a
          href="/api/public/zalo/authorize"
          className="mt-4 w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-[#0068FF] hover:bg-[#0052cc] text-white font-bold text-sm transition-colors"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 0 1-.5763-.5729l-.0006.0005a3.273 3.273 0 0 1-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 0 1 1.9378.6326zM6.9188 6.7896v.4482c0 .3159-.0906.6254-.2612.8914L2.7178 14.63h3.9502v.7682a.5764.5764 0 0 1-.5767.5761H.4133v-.4548c0-.3121.0879-.6182.2536-.8827l3.9598-6.5127H.665V7.366A.576.576 0 0 1 1.2417 6.79h5.6771zm10.6537 9.3733a3.2723 3.2723 0 0 1-3.2794-3.2666 3.2723 3.2723 0 0 1 3.2794-3.2667 3.2723 3.2723 0 0 1 3.2795 3.2667 3.2723 3.2723 0 0 1-3.2795 3.2666zm-9.9834-9.9243c.4966 0 .899.4023.899.899s-.4024.899-.899.899a.8993.8993 0 0 1-.8991-.899c0-.4967.4025-.899.8991-.899zm.6947 9.7515H6.9188v-6.19h.7488c.3564 0 .6462.2887.6462.6448v5.5452zm14.4432 0h-.7683v-6.1911h.7511c.3549 0 .6425.2876.6425.6423v5.5488zM10.5522 14.783c1.0007 0 1.8118-.8085 1.8118-1.8067s-.811-1.8068-1.8118-1.8068c-1.0007 0-1.8118.8087-1.8118 1.8068 0 .9982.8111 1.8067 1.8118 1.8067zm7.0409-.0518c1.0302 0 1.8654-.8329 1.8654-1.8608 0-1.028-.8352-1.861-1.8654-1.861-1.0303 0-1.8655.833-1.8655 1.861 0 1.0279.8352 1.8608 1.8655 1.8608z"/>
          </svg>
          Đăng nhập bằng Zalo
        </a>

        <p className="mt-2 text-xs text-ink-muted text-center">
          Chưa có tài khoản? Dùng Zalo là xong, không cần đăng ký.
        </p>

        <div className="mt-5 text-center text-sm">
          <Link to="/" className="text-brand-dark font-bold hover:underline">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
