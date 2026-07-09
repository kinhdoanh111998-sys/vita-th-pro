import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/vita-th-pro-logo.png";
import zaloLogoAsset from "@/assets/zalo-logo.png.asset.json";

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
          <img src={zaloLogoAsset.url} alt="Zalo" className="w-5 h-5" />
          Đăng nhập bằng Zalo
        </a>

        <p className="mt-2 text-xs text-ink-muted text-center">
          Chưa có tài khoản? Dùng Zalo là đăng nhập ngay.
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
