import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/vita-th-pro-logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function destinationForRole(role: string | null): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "manager":
    case "employee":
    case "staff":
      return "/portal/dashboard";
    case "customer":
      return "/portal/my-treatments";
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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !session) return;
    navigate({ to: destinationForRole(role), replace: true });
  }, [session, role, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
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
      setError(signInError?.message ?? "Đăng nhập thất bại");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("email", data.user.email!)
      .maybeSingle();

    setSubmitting(false);
    navigate({
      to: destinationForRole((profile?.role as string) ?? null),
      replace: true,
    });
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
              placeholder="Nhập số điện thoại hoặc email"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Mật khẩu</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm">
          <Link to="/" className="text-brand-dark font-bold hover:underline">
            ← Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
