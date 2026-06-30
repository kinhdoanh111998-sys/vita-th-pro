import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import logo from "@/assets/vita-th-pro-logo.png";

export const Route = createFileRoute("/dang-ky")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [ho_ten, setHoTen] = useState("");
  const [so_dien_thoai, setSoDienThoai] = useState("");
  const [mat_khau, setMatKhau] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Bước 1: kiểm tra mật khẩu
    if (mat_khau.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setSubmitting(true);

    // Bước 2: tạo virtual email
    const virtualEmail = `${so_dien_thoai}@khach.vitath.pro`;

    // Bước 3: gọi Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: virtualEmail,
      password: mat_khau,
    });

    // Bước 4: bắt lỗi Auth
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

    // Bước 5: đồng bộ DB
    if (data.user) {
      await supabase.from("customers").insert({
        email: virtualEmail,
        phone: so_dien_thoai,
        full_name: ho_ten,
      });
    }

    // Bước 6: thành công
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
              value={ho_ten}
              onChange={(e) => setHoTen(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Số điện thoại</label>
            <Input
              type="text"
              value={so_dien_thoai}
              onChange={(e) => setSoDienThoai(e.target.value)}
              placeholder="09xxxxxxxx"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">Mật khẩu</label>
            <Input
              type="password"
              value={mat_khau}
              onChange={(e) => setMatKhau(e.target.value)}
              placeholder="••••••••"
            />
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
