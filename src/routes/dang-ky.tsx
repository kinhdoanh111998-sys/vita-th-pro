import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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

  // Capture affiliate referrer: prefer localStorage (set globally on any page),
  // fallback to current URL query param ?ref=...
  const referredBy = useMemo(() => {
    if (typeof window === "undefined") return "";
    const fromStorage = localStorage.getItem("affiliate_ref");
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    return fromStorage || fromUrl || "";
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim().replace(/\s+/g, "");

    if (!trimmedName) {
      toast.error("Vui lòng nhập họ và tên");
      return;
    }
    if (!/^0\d{9,10}$/.test(trimmedPhone)) {
      toast.error("Số điện thoại không hợp lệ (VD: 09xxxxxxxx)");
      return;
    }
    // Cho phép mật khẩu bất kỳ (kể cả trùng số điện thoại). Chỉ cần khớp xác nhận.
    if (!password) {
      toast.error("Vui lòng nhập mật khẩu");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setSubmitting(true);

    const virtualEmail = `${trimmedPhone}@khach.vitath.pro`;

    const { data, error } = await supabase.auth.signUp({
      email: virtualEmail,
      password,
    });

    if (error) {
      console.error("[dang-ky] signUp error:", error);
      const msg = (error.message || "").toLowerCase();
      let friendly = error.message;
      if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("user already")) {
        friendly = "Số điện thoại này đã được đăng ký!";
      } else if (msg.includes("pwned") || msg.includes("leaked") || msg.includes("compromised")) {
        friendly = "Mật khẩu này quá phổ biến/đã bị lộ. Vui lòng chọn mật khẩu khác an toàn hơn.";
      } else if (msg.includes("weak") || msg.includes("password should")) {
        friendly = "Mật khẩu quá yếu. Hãy dùng ít nhất 8 ký tự gồm chữ và số.";
      } else if (msg.includes("invalid") && msg.includes("email")) {
        friendly = "Số điện thoại không hợp lệ.";
      } else if (msg.includes("rate") || msg.includes("too many")) {
        friendly = "Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.";
      } else if (msg.includes("signup") && msg.includes("disabled")) {
        friendly = "Chức năng đăng ký đang tạm khoá. Vui lòng liên hệ quản trị viên.";
      }
      toast.error(friendly);
      setSubmitting(false);
      return;
    }

    // Cập nhật biến local để phần insert dưới dùng đúng giá trị đã trim
    const phoneClean = trimmedPhone;
    const nameClean = trimmedName;

    if (data.user) {
      const { error: customerError } = await supabase.from("customers").insert({
        id: data.user.id,
        email: virtualEmail,
        phone: phoneClean,
        name: nameClean,
        referred_by: referredBy || null,
      });
      if (customerError) console.error("Lỗi tạo customer:", customerError);

      const { error: userError } = await supabase.from("users").insert({
        id: data.user.id,
        email: virtualEmail,
        phone: phoneClean,
        full_name: nameClean,
        role: "customer",
      });
      if (userError) console.error("Lỗi tạo user:", userError);
    }

    toast.success("Đăng ký thành công!");
    try {
      localStorage.removeItem("affiliate_ref");
    } catch {
      /* ignore */
    }
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
