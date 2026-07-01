import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, MapPin, CheckCircle2, Wallet, CreditCard, Smartphone } from "lucide-react";
import { useState } from "react";

const MOCK_CART = [
  {
    id: 1,
    name: "Yến Mạch Hữu Cơ Organic Oats 500g",
    price: 85000,
    qty: 2,
    image: "https://placehold.co/120x120/png",
  },
  {
    id: 2,
    name: "Serum Phục Hồi VITA",
    price: 350000,
    qty: 1,
    image: "https://placehold.co/120x120/png",
  },
];

const SHIPPING_FEE = 25000;

const PAYMENT_METHODS = [
  { id: "vita", label: "Điểm VITA", icon: Wallet, color: "text-green-600" },
  { id: "zalo", label: "ZaloPay", icon: Smartphone, color: "text-blue-500" },
  { id: "bank", label: "Chuyển khoản", icon: CreditCard, color: "text-pink-500" },
];

function formatVnd(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

function CheckoutPage() {
  const [method, setMethod] = useState("vita");

  const subtotal = MOCK_CART.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + SHIPPING_FEE;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-3 py-3 flex items-center gap-3">
        <Link
          to="/app/store"
          className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center"
          aria-label="Quay lại"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </Link>
        <h1 className="flex-1 text-center text-base font-bold text-gray-900 -ml-9">
          Thanh toán
        </h1>
      </header>

      {/* Địa chỉ nhận hàng */}
      <section className="bg-white mt-2 p-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 text-sm">Lê Văn A</span>
              <span className="text-sm text-gray-500">0900 000 111</span>
            </div>
            <p className="text-sm text-gray-600 mt-1 leading-snug">
              123 Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh
            </p>
          </div>
          <button className="text-xs font-semibold text-green-600">Thay đổi</button>
        </div>
      </section>

      {/* Danh sách sản phẩm */}
      <section className="bg-white mt-2 p-4">
        <h2 className="text-sm font-bold text-gray-900 mb-3">
          Sản phẩm ({MOCK_CART.length})
        </h2>
        <div className="space-y-3">
          {MOCK_CART.map((item) => (
            <div key={item.id} className="flex gap-3">
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover bg-gray-100"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                  {item.name}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">SL: x{item.qty}</span>
                  <span className="text-sm font-bold text-orange-500">
                    {formatVnd(item.price * item.qty)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Phương thức thanh toán */}
      <section className="bg-white mt-2 p-4">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Chọn phương thức</h2>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((m) => {
            const Icon = m.icon;
            const active = method === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m.id)}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition-colors ${
                  active
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${m.color}`} />
                <span
                  className={`text-xs font-semibold ${
                    active ? "text-green-700" : "text-gray-600"
                  }`}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mã AFF */}
        <div className="mt-4">
          <label className="text-sm font-bold text-gray-900">Mã AFF</label>
          <input
            type="text"
            defaultValue="AFF-VITA-21012"
            className="mt-2 w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-green-500"
          />
        </div>
      </section>

      {/* Tóm tắt đơn hàng */}
      <section className="bg-white mt-2 p-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Tạm tính</span>
          <span>{formatVnd(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Phí vận chuyển</span>
          <span>{formatVnd(SHIPPING_FEE)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <span className="font-bold text-gray-900">Tổng cộng</span>
          <span className="font-bold text-orange-500 text-base">
            {formatVnd(total)}
          </span>
        </div>
      </section>

      {/* Sticky bottom */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
        <div className="flex-1">
          <p className="text-xs text-gray-500">Tổng thanh toán</p>
          <p className="text-lg font-bold text-orange-500 leading-tight">
            {formatVnd(total)}
          </p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-3 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4" />
          Xác nhận đặt hàng
        </button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/app/store/checkout")({
  component: CheckoutPage,
});
