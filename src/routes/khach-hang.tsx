import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles, CheckCircle2, Copy, Link2, Users2, Share2, LogOut,
  ChevronDown, Search, X, ShieldCheck, Package,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import logo from "@/assets/vita-th-pro-logo.png";

export const Route = createFileRoute("/khach-hang")({
  component: KhachHangPage,
});

type Treatment = {
  id: string;
  order_id: string;
  session_number: number;
  status: string;
  qr_code_id: string;
  service_id: string | null;
};
type Order = {
  id: string;
  service_id: string | null;
  quantity: number | null;
  total_amount: number | null;
  status: string | null;
  created_at: string | null;
  order_code: string | null;
};
type OrderItem = {
  order_id: string;
  item_type: string;
  item_id: string | null;
  name: string | null;
  quantity: number | null;
  unit_price: number | null;
};
type Service = { id: string; name: string; default_sessions: number | null };

const money = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

function KhachHangPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const sessEmail = data.session?.user?.email ?? null;
      if (!sessEmail) {
        navigate({ to: "/login", replace: true });
        return;
      }
      setEmail(sessEmail);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (!sess) navigate({ to: "/login", replace: true });
      else setEmail(sess.user?.email ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  const customerQ = useQuery({
    queryKey: ["kh-customer-by-email", email],
    enabled: !!email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, name, phone, email")
        .eq("email", email!)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; name: string | null; phone: string | null; email: string | null } | null;
    },
  });

  const customerId = customerQ.data?.id ?? null;
  const fullName = customerQ.data?.name ?? email;
  const phone = customerQ.data?.phone ?? "";

  const treatmentsQ = useQuery({
    queryKey: ["kh-treatments", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("id, order_id, session_number, status, qr_code_id, service_id")
        .eq("customer_id", customerId!)
        .order("order_id")
        .order("session_number");
      if (error) throw error;
      return (data ?? []) as Treatment[];
    },
  });

  const orderIds = Array.from(new Set((treatmentsQ.data ?? []).map((t) => t.order_id)));

  const ordersQ = useQuery({
    queryKey: ["kh-orders", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, service_id, quantity, total_amount, status, created_at, order_code")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  const orderIdsForItems = (ordersQ.data ?? []).map((o) => o.id);
  const orderItemsQ = useQuery({
    queryKey: ["kh-order-items", orderIdsForItems.join(",")],
    enabled: orderIdsForItems.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("order_id, item_type, item_id, name, quantity, unit_price")
        .in("order_id", orderIdsForItems);
      if (error) throw error;
      return (data ?? []) as OrderItem[];
    },
  });

  const serviceIds = Array.from(
    new Set(
      [
        ...(treatmentsQ.data ?? []).map((t) => t.service_id),
        ...(ordersQ.data ?? []).map((o) => o.service_id),
      ].filter(Boolean) as string[],
    ),
  );
  const servicesQ = useQuery({
    queryKey: ["kh-services", serviceIds.join(",")],
    enabled: serviceIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, default_sessions")
        .in("id", serviceIds);
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });

  const serviceMap = useMemo(
    () => new Map((servicesQ.data ?? []).map((s) => [s.id, s])),
    [servicesQ.data],
  );
  const orderMap = useMemo(
    () => new Map((ordersQ.data ?? []).map((o) => [o.id, o])),
    [ordersQ.data],
  );

  /** Nhóm treatments theo order_id, chỉ giữ buổi PENDING tiếp theo (session_number nhỏ nhất). */
  const availableSessions = useMemo(() => {
    try {
      const groups = new Map<string, Treatment[]>();
      for (const t of treatmentsQ.data ?? []) {
        if (!t || t.status !== "pending") continue;
        const list = groups.get(t.order_id) ?? [];
        list.push(t);
        groups.set(t.order_id, list);
      }
      const out: Array<{
        treatment: Treatment;
        serviceName: string;
        totalSessions: number;
        remaining: number;
        packageIndex: number;
      }> = [];
      let idx = 0;
      for (const [orderId, list] of groups.entries()) {
        idx += 1;
        list.sort((a, b) => (a.session_number ?? 0) - (b.session_number ?? 0));
        const next = list[0];
        if (!next) continue;
        const order = orderMap.get(orderId);
        const svc = next.service_id ? serviceMap.get(next.service_id) : null;
        const totalSessions =
          (order?.quantity ?? 1) * (svc?.default_sessions ?? 1);
        out.push({
          treatment: next,
          serviceName: svc?.name ?? "Liệu trình",
          totalSessions: Number.isFinite(totalSessions) ? totalSessions : 1,
          remaining: list.length,
          packageIndex: idx,
        });
      }
      return out;
    } catch (e) {
      console.error("[khach-hang] availableSessions compute error:", e);
      return [];
    }
  }, [treatmentsQ.data, orderMap, serviceMap]);

  /** Đã sử dụng — treatments hoàn thành. */
  const usedSessions = useMemo(() => {
    try {
      return (treatmentsQ.data ?? [])
        .filter((t) => t && t.status !== "pending")
        .map((t) => {
          const svc = t.service_id ? serviceMap.get(t.service_id) : null;
          return {
            id: t.id,
            serviceName: svc?.name ?? "Liệu trình",
            session_number: t.session_number,
            status: t.status,
          };
        });
    } catch (e) {
      console.error("[khach-hang] usedSessions compute error:", e);
      return [];
    }
  }, [treatmentsQ.data, serviceMap]);

  // qrPayload sẽ được build inline khi render (phụ thuộc vào `selected` khai báo phía dưới).

  /* -------- Dropdown state -------- */
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
  const selected = availableSessions.find((s) => s.treatment.id === selectedTreatmentId) ?? null;

  const filteredPicker = availableSessions.filter((s) =>
    !pickerQuery.trim()
      ? true
      : s.serviceName.toLowerCase().includes(pickerQuery.trim().toLowerCase()),
  );

  /* -------- Affiliate (giữ nguyên logic cũ) -------- */
  const referrals = useQuery({
    queryKey: ["kh-affiliate-referrals", phone],
    enabled: !!phone,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("referred_by", phone);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = phone ? `${origin}/dang-ky?ref=${encodeURIComponent(phone)}` : "";

  async function handleCopy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Đã sao chép link giới thiệu!");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Không thể sao chép, vui lòng copy thủ công.");
    }
  }
  async function handleShare() {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Vita TH Pro",
          text: "Trải nghiệm dịch vụ chăm sóc cùng tôi tại Vita TH Pro!",
          url: link,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-muted">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f7f3]">
      <header className="bg-white border-b border-hairline">
        <div className="mx-auto max-w-[1180px] px-5 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="" className="h-9 rounded-lg" />
            <span className="font-black text-brand-dark">VITA TH PRO</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-muted hidden sm:inline">{fullName}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-5 py-8 space-y-10">
        <section>
          <div className="mb-5">
            <h1 className="text-2xl font-black text-brand-dark">Liệu trình của tôi</h1>
            <p className="text-sm text-ink-muted">
              Xin chào {fullName}, đây là danh sách liệu trình bạn đang sử dụng.
            </p>
          </div>

          {/* HAI CỘT */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* ============ TRÁI: Liệu trình còn khả dụng ============ */}
            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-brand/10 grid place-items-center text-brand-dark">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-brand-dark">Liệu trình còn khả dụng</h3>
                  <p className="text-xs text-ink-muted">
                    Chọn để lấy mã QR check-in cho buổi tiếp theo.
                  </p>
                </div>
                <span className="text-xs font-bold text-brand-dark bg-brand-soft rounded-full px-2.5 py-1">
                  {availableSessions.length}
                </span>
              </div>

              {/* Dropdown chọn liệu trình + search */}
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between gap-2 w-full rounded-xl border border-hairline bg-[#fafcf7] px-4 py-3 text-left hover:border-brand-primary transition"
                    disabled={availableSessions.length === 0}
                  >
                    <span className="text-sm">
                      {selected ? (
                        <>
                          <span className="font-bold text-brand-dark">
                            {selected.serviceName}
                          </span>
                          <span className="text-ink-muted">
                            {" "}
                            · Buổi #{selected.treatment.session_number}
                          </span>
                        </>
                      ) : availableSessions.length === 0 ? (
                        <span className="text-ink-muted italic">
                          Bạn chưa có buổi khả dụng
                        </span>
                      ) : (
                        <span className="text-ink-muted">
                          -- Chọn liệu trình để lấy mã QR --
                        </span>
                      )}
                    </span>
                    <ChevronDown className="w-4 h-4 text-ink-muted" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="p-0 w-[--radix-popover-trigger-width] bg-white z-50 shadow-md border border-hairline"
                >
                  <div className="p-2 border-b border-hairline">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                      <Input
                        placeholder="Tìm liệu trình…"
                        value={pickerQuery}
                        onChange={(e) => setPickerQuery(e.target.value)}
                        className="h-8 pl-8 text-xs"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {filteredPicker.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-ink-muted italic">
                        Không tìm thấy liệu trình.
                      </div>
                    ) : (
                      filteredPicker.map((s) => (
                        <button
                          key={s.treatment.id}
                          type="button"
                          onClick={() => {
                            setSelectedTreatmentId(s.treatment.id);
                            setPickerOpen(false); // collapse
                            setPickerQuery("");
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-brand-soft/60 border-b border-hairline last:border-b-0"
                        >
                          <div className="text-sm font-bold text-ink">
                            {s.serviceName}
                          </div>
                          <div className="text-[11px] text-ink-muted mt-0.5">
                            Buổi tiếp theo: #{s.treatment.session_number}/
                            {s.totalSessions} · còn {s.remaining} buổi
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Tóm tắt + QR */}
              {selected ? (
                <div className="rounded-2xl border border-hairline bg-gradient-to-br from-brand-soft to-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-ink-muted flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Mã QR check-in
                      </div>
                      <div className="font-black text-brand-dark mt-1">
                        {selected.serviceName}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        Buổi #{selected.treatment.session_number} /{" "}
                        {selected.totalSessions} · còn lại{" "}
                        <b className="text-brand-dark">{selected.remaining}</b>{" "}
                        buổi
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTreatmentId(null)}
                      className="text-ink-muted hover:text-rose-600"
                      aria-label="Bỏ chọn"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid place-items-center bg-white rounded-2xl p-4 border border-hairline">
                    <QRCodeCanvas
                      value={(() => {
                        try {
                          return JSON.stringify({
                            v: 1,
                            treatment_id: selected.treatment.id,
                            order_id: selected.treatment.order_id,
                            session_number: selected.treatment.session_number,
                            qr_code_id: selected.treatment.qr_code_id,
                          });
                        } catch {
                          return selected.treatment.qr_code_id ?? "";
                        }
                      })()}
                      size={192}
                      level="H"
                      includeMargin={false}
                    />
                    <div className="mt-2 text-[10px] font-mono text-ink-muted">
                      #{selected.treatment.session_number} · {selected.treatment.qr_code_id.slice(0, 8)}…
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-center text-ink-muted">
                    Đưa mã này cho kỹ thuật viên để check-in buổi.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-hairline bg-[#fafcf7] p-6 text-center text-xs text-ink-muted">
                  Chọn 1 liệu trình từ dropdown bên trên để hiển thị mã QR.
                </div>
              )}
            </div>

            {/* ============ PHẢI: Đơn hàng + Liệu trình đã sử dụng ============ */}
            <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 grid place-items-center text-emerald-700">
                  <Package className="w-5 h-5" />
                </div>
                {/* "Đơn hàng" được thiết kế NHỎ hơn "Liệu trình của tôi" */}
                <div className="flex-1">
                  <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wider">
                    Đơn hàng
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Dịch vụ/sản phẩm đã mua & buổi đã sử dụng.
                  </p>
                </div>
              </div>

              {/* Buổi đã sử dụng */}
              <div>
                <div className="text-[11px] uppercase tracking-widest text-ink-muted font-semibold mb-2">
                  Liệu trình đã sử dụng ({usedSessions.length})
                </div>
                {usedSessions.length === 0 ? (
                  <div className="rounded-xl border border-hairline bg-[#fafcf7] p-4 text-xs text-ink-muted italic text-center">
                    Chưa có buổi nào được ghi nhận.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {usedSessions.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-2 rounded-xl border border-hairline bg-[#fafcf7] px-3 py-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="flex-1 text-sm">
                          <span className="font-semibold text-ink">
                            {u.serviceName}
                          </span>{" "}
                          <span className="text-ink-muted">— Buổi #{u.session_number}</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          {u.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Đơn hàng */}
              <div>
                <div className="text-[11px] uppercase tracking-widest text-ink-muted font-semibold mb-2">
                  Đơn hàng ({ordersQ.data?.length ?? 0})
                </div>
                {ordersQ.isLoading ? (
                  <div className="rounded-xl border border-hairline bg-[#fafcf7] p-4 text-xs text-ink-muted italic text-center">
                    Đang tải đơn hàng…
                  </div>
                ) : ordersQ.error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 text-center">
                    Không tải được đơn hàng: {(ordersQ.error as Error).message}
                  </div>
                ) : (ordersQ.data ?? []).length === 0 ? (
                  <div className="rounded-xl border border-hairline bg-[#fafcf7] p-4 text-xs text-ink-muted italic text-center">
                    Bạn chưa có đơn hàng nào.
                  </div>
                ) : (
                  <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {(ordersQ.data ?? []).map((o) => {
                      const items = (orderItemsQ.data ?? []).filter((it) => it.order_id === o.id);
                      const displayName =
                        items.length > 0
                          ? items.map((it) => it.name ?? "—").join(", ")
                          : o.service_id
                          ? serviceMap.get(o.service_id)?.name ?? "Đơn hàng"
                          : "Đơn hàng";
                      const totalQty = items.length > 0
                        ? items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
                        : (o.quantity ?? 1);
                      const isPaid = o.status === "paid";
                      return (
                        <li
                          key={o.id}
                          className="rounded-xl border border-hairline px-3 py-2 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-ink truncate">
                              {displayName}
                            </div>
                            <div className="text-[10px] text-ink-muted">
                              #{o.order_code ?? o.id.slice(0, 6)} ·{" "}
                              {o.created_at
                                ? new Date(o.created_at).toLocaleDateString("vi-VN")
                                : ""}{" "}
                              · SL {totalQty}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-brand-dark">
                              {money(Number(o.total_amount ?? 0))}
                            </div>
                            <span
                              className={
                                "text-[10px] px-2 py-0.5 rounded-full font-bold " +
                                (isPaid
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800")
                              }
                            >
                              {isPaid ? "Đã thanh toán" : (o.status ?? "—")}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Affiliate — giữ nguyên */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-brand-dark">Tiếp thị liên kết</h2>
            <p className="text-sm text-ink-muted">
              Chia sẻ link giới thiệu của bạn. Mỗi lượt đặt lịch qua link sẽ được ghi nhận tự động.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 rounded-2xl border border-hairline bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-brand-dark font-extrabold mb-3">
                <Link2 className="w-5 h-5" />
                Link giới thiệu của bạn
              </div>

              {customerQ.isLoading ? (
                <div className="text-ink-muted">Đang tải...</div>
              ) : !phone ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 p-4 text-sm">
                  Tài khoản chưa có số điện thoại. Vui lòng liên hệ Spa để cập nhật để dùng tính năng giới thiệu.
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 rounded-xl border border-hairline bg-[#f7faf7] px-4 py-3 font-mono text-sm break-all">
                      {link}
                    </div>
                    <Button onClick={handleCopy} className="sm:w-auto">
                      <Copy className="w-4 h-4" />
                      {copied ? "Đã sao chép" : "Copy Link"}
                    </Button>
                    <Button variant="outline" onClick={handleShare} className="sm:w-auto">
                      <Share2 className="w-4 h-4" />
                      Chia sẻ
                    </Button>
                  </div>
                  <p className="text-xs text-ink-muted mt-3">
                    Mã giới thiệu của bạn: <span className="font-bold text-ink">{phone}</span>
                  </p>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-hairline bg-gradient-to-br from-brand to-brand-dark text-white p-6 shadow-sm">
              <div className="flex items-center gap-2 font-extrabold mb-2">
                <Users2 className="w-5 h-5" />
                Đã giới thiệu thành công
              </div>
              <div className="text-5xl font-black leading-none mt-3">
                {referrals.isLoading ? "…" : (referrals.data ?? 0)}
              </div>
              <div className="text-white/80 text-sm mt-2">lượt đặt lịch qua link của bạn</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-hairline bg-white p-5 text-sm text-ink-muted">
            <strong className="text-ink">Cách hoạt động:</strong> Khi khách truy cập link của bạn, hệ thống tự động lưu mã giới thiệu. Mọi lịch hẹn họ đặt trong cùng phiên trình duyệt sẽ được ghi nhận cho bạn.
          </div>
        </section>
      </main>
    </div>
  );
}
