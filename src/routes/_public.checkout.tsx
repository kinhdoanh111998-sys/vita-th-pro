import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  MapPin,
  Loader2,
  Wallet,
  CreditCard,
  Ticket,
  X,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { useCartStore, useCartTotals } from "@/lib/cart/useCartStore";
import { RequireAuthDialog } from "@/components/RequireAuthDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_public/checkout")({
  component: CheckoutPage,
  head: () => ({
    meta: [
      { title: "Thanh toán | Vita TH Pro" },
      { name: "description", content: "Xác nhận và thanh toán đơn hàng Vita TH Pro." },
    ],
  }),
});

const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

type Voucher = {
  id: string;
  code: string;
  discount_type: "percent" | "amount";
  discount_value: number;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean;
};

type PayMethod = "cod" | "transfer";

function CheckoutPage() {
  const navigate = useNavigate();
  const { session, email, loading: authLoading } = useAuth();
  const { lines, totalAmount, totalQty } = useCartTotals();
  const clearCart = useCartStore((s) => s.clear);
  const removeItem = useCartStore((s) => s.remove);

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<PayMethod>("cod");
  const [voucherCode, setVoucherCode] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderCode] = useState<string>(() => "DH" + Date.now());

  // Bắt buộc auth
  useEffect(() => {
    if (!authLoading && !session) setAuthDialogOpen(true);
  }, [authLoading, session]);

  // Auto-fill từ bảng customers
  const { data: currentCustomer } = useQuery({
    queryKey: ["checkout-current-customer", email],
    enabled: !!email,
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id, name, full_name, phone, address")
        .eq("email", email!)
        .maybeSingle();
      return data as
        | { id: string; name: string | null; full_name: string | null; phone: string | null; address: string | null }
        | null;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (currentCustomer && !customerName)
      setCustomerName(currentCustomer.full_name ?? currentCustomer.name ?? "");
    if (currentCustomer && !customerPhone)
      setCustomerPhone(currentCustomer.phone ?? "");
    if (currentCustomer && !address) setAddress(currentCustomer.address ?? "");
  }, [currentCustomer]);

  const discountAmount = useMemo(() => {
    if (!appliedVoucher) return 0;
    const val = Number(appliedVoucher.discount_value) || 0;
    const raw =
      appliedVoucher.discount_type === "percent"
        ? Math.round((totalAmount * val) / 100)
        : val;
    return Math.min(raw, totalAmount);
  }, [appliedVoucher, totalAmount]);

  const finalAmount = Math.max(0, totalAmount - discountAmount);

  const applyVoucher = async () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) {
      toast.error("Vui lòng nhập mã voucher");
      return;
    }
    setApplyingVoucher(true);
    try {
      const { data: v, error } = await supabase
        .from("vouchers")
        .select("*")
        .eq("code", code)
        .maybeSingle();
      if (error) throw error;
      if (!v) {
        setAppliedVoucher(null);
        toast.error("Mã voucher không tồn tại");
        return;
      }
      if (!v.is_active) {
        setAppliedVoucher(null);
        toast.error("Voucher đã tạm dừng");
        return;
      }
      const now = Date.now();
      if (v.valid_from && new Date(v.valid_from).getTime() > now) {
        setAppliedVoucher(null);
        toast.error("Voucher chưa đến ngày áp dụng");
        return;
      }
      if (v.valid_to && new Date(v.valid_to).getTime() < now) {
        setAppliedVoucher(null);
        toast.error("Voucher đã hết hạn");
        return;
      }
      setAppliedVoucher(v as Voucher);
      toast.success(`Đã áp mã ${v.code}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không kiểm tra được voucher");
    } finally {
      setApplyingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode("");
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!session) {
      setAuthDialogOpen(true);
      return;
    }
    if (lines.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Vui lòng nhập tên và số điện thoại");
      return;
    }

    setSubmitting(true);
    try {
      const uid = session?.user?.id;
      if (!uid) throw new Error("Chưa đăng nhập");

      let customerId = currentCustomer?.id;
      if (!customerId) {
        const { data: newCus, error: cErr } = await supabase
          .from("customers")
          .insert({
            id: uid,
            name: customerName.trim(),
            full_name: customerName.trim(),
            phone: customerPhone.trim(),
            email: email,
            address: address.trim() || null,
          })
          .select("id")
          .single();
        if (cErr) {
          throw new Error("Lỗi tạo khách hàng: " + cErr.message);
        }
        customerId = newCus.id as string;
      }

      const isApp =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/app");

      // LƯU ĐƠN HÀNG
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          order_code: orderCode,
          subtotal_amount: totalAmount,
          discount_amount: discountAmount,
          total_amount: finalAmount,
          voucher_id: appliedVoucher?.id ?? null,
          voucher_code: appliedVoucher?.code ?? null,
          status: "pending_payment",
          payment_method: method,
          payment_status: "pending",
          order_source: isApp ? "app" : "web",
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          shipping_address: address.trim() || null,
          note: note.trim() || null,
        })
        .select("id, order_code")
        .single();

      if (oErr) throw new Error("Lỗi tạo đơn hàng: " + oErr.message);

      const insertedOrderId = order.id as string;
      const finalOrderCode = (order.order_code as string) ?? orderCode;

      // LƯU CHI TIẾT SẢN PHẨM (Đúng 6 cột chuẩn của DB)
      const rows = lines.map((l) => ({
        order_id: insertedOrderId,
        item_type: l.type === "product" ? "product" : "service", // Ép kiểu chuẩn Enum
        item_id: l.id,
        quantity: Number(l.qty),
        unit_price: Number(l.price),
        total_price: Number(l.price) * Number(l.qty),
      }));

      console.log("[checkout] order_items rows chuẩn bị lưu:", rows);

      const { error: iErr } = await supabase.from("order_items").insert(rows);
      if (iErr) {
        console.error("[checkout] order_items insert error:", iErr, rows);
        
        // Hủy luôn vỏ đơn vừa tạo nếu lưu ruột đơn thất bại (Tránh rác data)
        await supabase
          .from("orders")
          .update({ status: "cancelled", note: "Lỗi hệ thống: Không lưu được chi tiết đơn" })
          .eq("id", insertedOrderId);
          
        throw new Error("Lỗi lưu chi tiết sản phẩm: " + iErr.message);
      }

      // SAU KHI LƯU THÀNH CÔNG -> Clear giỏ và nhảy trang
      clearCart();

      try {
        await supabase.from("notifications").insert({
          recipient_id: uid,
          type: "order_created",
          title: "Đơn hàng đã tạo",
          body: `Đơn hàng ${finalOrderCode} của bạn đã được tạo thành công.`,
          ref_type: "order",
          ref_id: insertedOrderId,
        });
      } catch (notifyErr) {
        console.error("Lỗi thông báo:", notifyErr);
      }

      toast.success("Đã xác nhận đơn hàng thành công", { duration: 3000 });

      setTimeout(() => {
        navigate({ to: "/app" });
      }, 3000);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Đặt đơn thất bại";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const vietQrUrl = `https://img.vietqr.io/image/MBBank-686288889999-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(orderCode)}&accountName=Cong%20Ty%20Tnhh%20Xuat%20Nhap%20Khau%20Thiet%20Bi%20Cham%20Soc%20Suc%20Khoe%20Tri%20Tue%20Nhan%20Tao`;

  if (authLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-3 py-3 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center"
          aria-label="Quay lại"
          type="button"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="flex-1 text-center text-base font-bold text-gray-900 -ml-9">
          Thanh toán
        </h1>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        {/* Guest reminder */}
        {!session && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
            Bạn cần đăng nhập để tiếp tục thanh toán.{" "}
            <Link to="/login" className="font-bold underline">
              Đăng nhập ngay
            </Link>
          </div>
        )}

        {/* Thông tin nhận hàng */}
        <section className="bg-white rounded-2xl p-4 space-y-3 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-gray-900">Thông tin nhận hàng</h2>
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-gray-600">Họ tên</label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <label className="text-xs font-semibold text-gray-600 mt-2">Số điện thoại</label>
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            <label className="text-xs font-semibold text-gray-600 mt-2">Địa chỉ (nếu giao hàng)</label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
            <label className="text-xs font-semibold text-gray-600 mt-2">Ghi chú</label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Ghi chú thêm cho đơn hàng…" />
          </div>
        </section>

        {/* Danh sách Sản phẩm */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-3">Sản phẩm ({totalQty})</h2>
          {lines.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Giỏ hàng trống.</p>
          ) : (
            <ul className="space-y-3">
              {lines.map((l) => (
                <li key={l.id} className="flex gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {l.image && <img src={l.image} alt={l.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">{l.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">x{l.qty}</span>
                      <span className="text-sm font-bold text-brand-primary">{fmt(l.qty * l.price)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(l.id)}
                    aria-label={`Xóa ${l.name}`}
                    className="self-start p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Xóa khỏi giỏ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Voucher */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Ticket className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-gray-900">Mã giảm giá</h2>
          </div>
          {appliedVoucher ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <div>
                <div className="text-sm font-bold text-emerald-800">{appliedVoucher.code}</div>
                <div className="text-xs text-emerald-700">
                  Giảm{" "}
                  {appliedVoucher.discount_type === "percent"
                    ? `${appliedVoucher.discount_value}%`
                    : fmt(Number(appliedVoucher.discount_value))}
                </div>
              </div>
              <button
                type="button"
                onClick={removeVoucher}
                aria-label="Bỏ voucher"
                className="text-gray-400 hover:text-rose-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Nhập mã voucher"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
              />
              <Button type="button" onClick={applyVoucher} disabled={applyingVoucher} variant="outline">
                {applyingVoucher ? <Loader2 className="w-4 h-4 animate-spin" /> : "Áp dụng"}
              </Button>
            </div>
          )}
        </section>

        {/* Phương thức thanh toán */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-3">Phương thức thanh toán</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod("cod")}
              className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border-2 transition-colors ${
                method === "cod" ? "border-emerald-600 bg-emerald-50" : "border-gray-200 bg-white"
              }`}
            >
              <Wallet className={`w-5 h-5 ${method === "cod" ? "text-emerald-700" : "text-gray-500"}`} />
              <span className={`text-sm font-semibold ${method === "cod" ? "text-emerald-700" : "text-gray-600"}`}>
                Thanh toán Tại cửa hàng
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMethod("transfer")}
              className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border-2 transition-colors ${
                method === "transfer" ? "border-emerald-600 bg-emerald-50" : "border-gray-200 bg-white"
              }`}
            >
              <CreditCard className={`w-5 h-5 ${method === "transfer" ? "text-emerald-700" : "text-gray-500"}`} />
              <span className={`text-sm font-semibold ${method === "transfer" ? "text-emerald-700" : "text-gray-600"}`}>
                Chuyển khoản (VietQR)
              </span>
            </button>
          </div>

          {method === "transfer" && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
              <div className="grid place-items-center bg-white rounded-lg p-3 border border-emerald-100">
                <img
                  src={vietQrUrl}
                  alt={`VietQR đơn ${orderCode}`}
                  className="w-64 h-64 object-contain"
                />
              </div>
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between"><span>Mã đơn</span><b className="font-mono text-emerald-700">{orderCode}</b></div>
                <div className="flex justify-between"><span>Số tiền</span><b className="text-brand-primary">{fmt(finalAmount)}</b></div>
              </div>
              <p className="mt-2 text-xs text-gray-600 italic text-center">
                Quý khách vui lòng quét mã thanh toán, sau đó bấm Xác nhận đặt hàng bên dưới.
              </p>
            </div>
          )}
        </section>

        {/* Totals */}
        <section className="bg-white rounded-2xl p-4 space-y-2 text-sm shadow-sm border border-gray-100">
          <div className="flex justify-between text-gray-600">
            <span>Tạm tính</span>
            <span>{fmt(totalAmount)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Giảm giá</span>
              <span>-{fmt(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="font-bold text-gray-900">Tổng cộng</span>
            <span className="font-bold text-brand-primary text-lg">{fmt(finalAmount)}</span>
          </div>
        </section>
      </div>

      {/* FIXED FOOTER MỚI: z-[9999] và bottom-[80px] để luôn nổi trên mọi màn hình */}
      <div className="fixed bottom-[80px] md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[9999] shadow-[0_-4px_15px_rgba(0,0,0,0.08)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500">Tổng thanh toán</p>
            <p className="text-lg font-bold text-brand-primary leading-tight">{fmt(finalAmount)}</p>
          </div>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || lines.length === 0}
            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
            {submitting ? "Đang xử lý…" : "Xác nhận đặt hàng"}
          </Button>
        </div>
      </div>

      <RequireAuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} intent="order" />

    </div>
  );
}
