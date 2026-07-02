import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getStoredRef, clearRef } from "@/lib/refTracker";
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

  // Ref code (6 ký tự) từ localStorage do PublicLayout đã lưu, hoặc từ URL.
  const refCode = useMemo(() => {
    if (typeof window === "undefined") return "";
    const stored = getStoredRef();
    if (stored) return stored;
    const url = new URLSearchParams(window.location.search).get("ref");
    return (url || "").trim().toUpperCase();
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

        <a
          href="/api/public/zalo/authorize"
          className="mb-4 w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-[#0068FF] hover:bg-[#0052cc] text-white font-bold text-sm transition-colors"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 0 1-.5763-.5729l-.0006.0005a3.273 3.273 0 0 1-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 0 1 1.9378.6326zM6.9188 6.7896v.4482c0 .3159-.0906.6254-.2612.8914L2.7178 14.63h3.9502v.7682a.5764.5764 0 0 1-.5767.5761H.4133v-.4548c0-.3121.0879-.6182.2536-.8827l3.9598-6.5127H.665V7.366A.576.576 0 0 1 1.2417 6.79h5.6771zm10.6537 9.3733a3.2723 3.2723 0 0 1-3.2794-3.2666 3.2723 3.2723 0 0 1 3.2794-3.2667 3.2723 3.2723 0 0 1 3.2795 3.2667 3.2723 3.2723 0 0 1-3.2795 3.2666zm-9.9834-9.9243c.4966 0 .899.4023.899.899s-.4024.899-.899.899a.8993.8993 0 0 1-.8991-.899c0-.4967.4025-.899.8991-.899zm.6947 9.7515H6.9188v-6.19h.7488c.3564 0 .6462.2887.6462.6448v5.5452zm14.4432 0h-.7683v-6.1911h.7511c.3549 0 .6425.2876.6425.6423v5.5488zM10.5522 14.783c1.0007 0 1.8118-.8085 1.8118-1.8067s-.811-1.8068-1.8118-1.8068c-1.0007 0-1.8118.8087-1.8118 1.8068 0 .9982.8111 1.8067 1.8118 1.8067zm7.0409-.0518c1.0302 0 1.8654-.8329 1.8654-1.8608 0-1.028-.8352-1.861-1.8654-1.861-1.0303 0-1.8655.833-1.8655 1.861 0 1.0279.8352 1.8608 1.8655 1.8608z"/>
          </svg>
          Đăng ký nhanh bằng Zalo (không cần điền form)
        </a>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-hairline" />
          <span className="text-xs text-ink-muted uppercase tracking-wider">hoặc điền form</span>
          <div className="h-px flex-1 bg-hairline" />
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
