import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/vita-th-pro-logo.png";

export const Route = createFileRoute("/dang-ky")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setSubmitting(true);

    const virtualEmail = `${phone}@khach.vitath.pro`;

    const { data, error } = await supabase.auth.signUp({
      email: virtualEmail,
      password,
    });

    if (error && error.message.includes("already registered")) {
      toast.error("Số điện thoại này đã được đăng ký!");
      setSubmitting(false);
      return;
    }
    if (error) {
      toast.error("Đăng ký thất bại: " + error.message);
      setSubmitting(false);
      return;
    }

    if (data.user) {
      await supabase.from("customers").insert({
        email: virtualEmail,
        phone,
        full_name: fullName,
      });
    }

    toast.success("Đăng ký thành công!");
    navigate({ to: "/khach-hang", replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f3f7f3] flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white border border-hairline rounded-2xl p-7 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <img src={logo} alt="" className="h-12 rounded-xl" />
          <div>
            <h1 className="text-xl font-black text-brand-dark">Đăng ký</h1>
            <p className="text-sm text-ink-muted">VITA TH PRO</p>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <div>
            <label className="block text-sm font-bold mb-1">Họ và tên</label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Số điện thoại</label>
            <Input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Mật khẩu</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-brand-dark"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Xác nhận mật khẩu</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-brand-dark"
                aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Đang đăng ký..." : "Đăng ký"}
          </Button>
        </form>

        <div className="mt-5 text-center text-sm space-x-3">
          <Link to="/login" className="text-brand-dark font-bold hover:underline">
            Đã có tài khoản? Đăng nhập
          </Link>
          <span className="text-ink-muted">·</span>
          <Link to="/" className="text-brand-dark font-bold hover:underline">
            ← Trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
