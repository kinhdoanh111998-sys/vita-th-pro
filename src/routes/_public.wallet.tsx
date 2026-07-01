import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Wallet,
  Crown,
  Gift,
  Sparkles,
  TrendingUp,
  Phone,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_public/wallet")({
  head: () => ({
    meta: [
      { title: "Ví VITA & Ưu đãi — VITA TH Pro" },
      {
        name: "description",
        content:
          "Ví VITA tích luỹ điểm thưởng, ưu đãi độc quyền dành cho khách hàng thân thiết.",
      },
    ],
  }),
  component: WalletPage,
});

// Deterministic pseudo-random points from phone (for placeholder display)
function pointsFromPhone(phone: string): number {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return 0;
  let hash = 0;
  for (let i = 0; i < digits.length; i++) hash = (hash * 31 + digits.charCodeAt(i)) | 0;
  return 500 + (Math.abs(hash) % 9500);
}

function tierFromPoints(p: number) {
  if (p >= 8000) return { name: "VIP Diamond", color: "from-violet-500 to-fuchsia-500" };
  if (p >= 5000) return { name: "VIP Gold", color: "from-amber-500 to-yellow-500" };
  if (p >= 2000) return { name: "VIP Silver", color: "from-slate-400 to-slate-600" };
  return { name: "Member", color: "from-emerald-500 to-emerald-700" };
}

function WalletPage() {
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const points = submitted ? pointsFromPhone(submitted) : 0;
  const tier = tierFromPoints(points);
  const nextTier = points >= 8000 ? 10000 : points >= 5000 ? 8000 : points >= 2000 ? 5000 : 2000;

  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto max-w-[980px] px-4 md:px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3">
            <Wallet className="w-3.5 h-3.5" /> VITA WALLET
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
            Ví VITA & Ưu đãi
          </h1>
          <p className="mt-2 text-gray-500 max-w-[560px] mx-auto">
            Tra cứu điểm tích luỹ, hạng thành viên và ưu đãi độc quyền dành cho khách hàng thân thiết.
          </p>
        </div>

        {!submitted ? (
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nhập số điện thoại để tra cứu
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xx xxx xxx"
                className="w-full h-12 pl-10 pr-3 rounded-xl border border-gray-300 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <button
              onClick={() => {
                if (phone.replace(/\D/g, "").length < 9) return;
                setSubmitted(phone);
              }}
              className="mt-4 w-full h-12 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
            >
              Tra cứu điểm VIP
            </button>
            <p className="text-xs text-gray-400 mt-3 text-center">
              * Bản dùng thử. Điểm hiển thị mang tính minh hoạ hạng thành viên.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Balance card */}
            <div
              className={`relative overflow-hidden rounded-3xl p-8 text-white bg-gradient-to-br ${tier.color} shadow-xl`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/80 text-sm">Số dư điểm VITA</p>
                  <p className="text-5xl font-black mt-2 tracking-tight">
                    {points.toLocaleString("vi-VN")}
                  </p>
                  <p className="text-white/80 text-xs mt-1">SĐT: {submitted}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur">
                  <Crown className="w-4 h-4" />
                  <span className="text-sm font-bold">{tier.name}</span>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-xs text-white/80 mb-1.5">
                  <span>Còn {(nextTier - points).toLocaleString("vi-VN")} điểm để lên hạng</span>
                  <span>{nextTier.toLocaleString("vi-VN")}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${Math.min(100, (points / nextTier) * 100)}%` }}
                  />
                </div>
              </div>

              <Sparkles className="absolute -right-6 -top-6 w-40 h-40 text-white/10" />
            </div>

            {/* Perks */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: Gift, title: "Voucher độc quyền", desc: "Ưu đãi 15% liệu trình cao cấp" },
                { icon: TrendingUp, title: "Tích 1% mỗi giao dịch", desc: "Đổi trực tiếp thành voucher" },
                { icon: Crown, title: "Ưu tiên đặt lịch VIP", desc: "Miễn phí soi da AI hàng quý" },
              ].map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl bg-white border border-gray-200 p-5 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <p.icon className="w-5 h-5" />
                  </div>
                  <div className="font-bold text-gray-900">{p.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{p.desc}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/booking"
                className="inline-flex items-center gap-1.5 h-11 px-5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
              >
                Đặt lịch dùng điểm <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => {
                  setSubmitted(null);
                  setPhone("");
                }}
                className="h-11 px-5 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Tra cứu số khác
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
