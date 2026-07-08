import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles, CheckCircle2, Copy, Link2, Users2, Share2,
  ChevronDown, Search, X, ShieldCheck, Package, Gift, Award, Trophy,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/AuthContext";

type Treatment = { id: string; order_id: string; session_number: number; status: string; qr_code_id: string; service_id: string | null };
type Order = { id: string; service_id: string | null; quantity: number | null; total_amount: number | null; status: string | null; created_at: string | null; order_code: string | null };
type OrderItem = { id: string; order_id: string; item_type: string; item_id: string | null; quantity: number | null; unit_price: number | null; total_price: number | null };
type Service = { id: string; name: string; default_sessions: number | null };

const money = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function CustomerHomeContent() {
  const { email } = useAuth();
  const [copied, setCopied] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const customerQ = useQuery({
    queryKey: ["kh-customer-by-email", email],
    enabled: !!email,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, name, phone, email")
          .eq("email", email!)
          .maybeSingle();
        if (error) throw error;
        return data as { id: string; name: string | null; phone: string | null; email: string | null } | null;
      } catch (e) {
        console.warn("[CustomerHome] customer query", e);
        return null;
      }
    },
  });

  const customerId = customerQ.data?.id ?? null;
  const fullName = customerQ.data?.name ?? email;
  const phone = customerQ.data?.phone ?? "";

  const treatmentsQ = useQuery({
    queryKey: ["kh-treatments", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("treatments")
          .select("id, order_id, session_number, status, qr_code_id, service_id")
          .eq("customer_id", customerId!)
          .order("order_id")
          .order("session_number");
        if (error) throw error;
        return (data ?? []) as Treatment[];
      } catch (e) { console.warn("[CustomerHome] treatments", e); return [] as Treatment[]; }
    },
  });

  const ordersQ = useQuery({
    queryKey: ["kh-orders", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, service_id, quantity, total_amount, status, created_at, order_code")
          .eq("customer_id", customerId!)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data ?? []) as Order[];
      } catch (e) { console.warn("[CustomerHome] orders", e); return [] as Order[]; }
    },
  });

  // Nhận diện tín hiệu mở Popup từ trang Thông báo
  useEffect(() => {
    const viewOrderId = sessionStorage.getItem("viewOrderId");
    if (viewOrderId && ordersQ.data && ordersQ.data.length > 0) {
      const orderToView = ordersQ.data.find(o => o.id === viewOrderId);
      if (orderToView) {
        setSelectedOrder(orderToView);
        sessionStorage.removeItem("viewOrderId");
      }
    }
  }, [ordersQ.data]);

  const orderIdsForItems = (ordersQ.data ?? []).map((o) => o.id);
  const orderItemsQ = useQuery({
    queryKey: ["kh-order-items", orderIdsForItems.join(",")],
    enabled: orderIdsForItems.length > 0,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("order_items")
          .select("order_id, item_type, item_id, quantity, unit_price, total_price")
          .in("order_id", orderIdsForItems);
        if (error) throw error;
        return (data ?? []) as OrderItem[];
      } catch (e) { console.warn("[CustomerHome] items", e); return [] as OrderItem[]; }
    },
  });

  // TỔNG HỢP TOÀN BỘ ID (Sản phẩm & Dịch vụ) để quét tên
  const allItemIds = Array.from(
    new Set([
      ...(treatmentsQ.data ?? []).map((t) => t.service_id),
      ...(ordersQ.data ?? []).map((o) => o.service_id),
      ...(orderItemsQ.data ?? []).map((it) => it.item_id)
    ].filter(Boolean) as string[])
  );

  const servicesQ = useQuery({
    queryKey: ["kh-services", allItemIds.join(",")],
    enabled: allItemIds.length > 0,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("services").select("id, name, default_sessions").in("id", allItemIds);
        if (error) throw error;
        return (data ?? []) as Service[];
      } catch (e) { console.warn("[CustomerHome] services", e); return [] as Service[]; }
    },
  });

  // QUÉT THÊM KHO SẢN PHẨM ĐỂ LẤY TÊN
  const productsQ = useQuery({
    queryKey: ["kh-products", allItemIds.join(",")],
    enabled: allItemIds.length > 0,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products").select("id, name").in("id", allItemIds);
        if (error) throw error;
        return (data ?? []) as { id: string; name: string }[];
      } catch (e) { console.warn("[CustomerHome] products", e); return [] as { id: string; name: string }[]; }
    },
  });

  // Bản đồ tên gọi tổng hợp (Cả SP và DV)
  const catalogNameMap = useMemo(() => {
    const map = new Map<string, string>();
    (servicesQ.data ?? []).forEach(s => map.set(s.id, s.name));
    (productsQ.data ?? []).forEach(p => map.set(p.id, p.name));
    return map;
  }, [servicesQ.data, productsQ.data]);

  const serviceMap = useMemo(() => new Map((servicesQ.data ?? []).map((s) => [s.id, s])), [servicesQ.data]);
  const orderMap = useMemo(() => new Map((ordersQ.data ?? []).map((o) => [o.id, o])), [ordersQ.data]);

  const availableSessions = useMemo(() => {
    try {
      const groups = new Map<string, Treatment[]>();
      for (const t of treatmentsQ.data ?? []) {
        if (!t || t.status !== "pending") continue;
        const list = groups.get(t.order_id) ?? [];
        list.push(t);
        groups.set(t.order_id, list);
      }
      const out: Array<{ treatment: Treatment; serviceName: string; totalSessions: number; remaining: number; packageIndex: number }> = [];
      let idx = 0;
      for (const [orderId, list] of groups.entries()) {
        idx += 1;
        list.sort((a, b) => (a.session_number ?? 0) - (b.session_number ?? 0));
        const next = list[0];
        if (!next) continue;
        const order = orderMap.get(orderId);
        const svc = next.service_id ? serviceMap.get(next.service_id) : null;
        const svcName = next.service_id ? catalogNameMap.get(next.service_id) : null;
        const totalSessions = (order?.quantity ?? 1) * (svc?.default_sessions ?? 1);
        out.push({
          treatment: next,
          serviceName: svcName ?? "Liệu trình",
          totalSessions: Number.isFinite(totalSessions) ? totalSessions : 1,
          remaining: list.length,
          packageIndex: idx,
        });
      }
      return out;
    } catch (e) { console.error("[CustomerHome] availableSessions", e); return []; }
  }, [treatmentsQ.data, orderMap, serviceMap, catalogNameMap]);

  const usedSessions = useMemo(() => {
    try {
      return (treatmentsQ.data ?? [])
        .filter((t) => t && t.status !== "pending")
        .map((t) => {
          const svcName = t.service_id ? catalogNameMap.get(t.service_id) : null;
          return { id: t.id, serviceName: svcName ?? "Liệu trình", session_number: t.session_number, status: t.status };
        });
    } catch (e) { console.error("[CustomerHome] usedSessions", e); return []; }
  }, [treatmentsQ.data, catalogNameMap]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
  useEffect(() => { setSelectedTreatmentId(null); }, [customerId]);
  const selected = availableSessions.find((s) => s.treatment.id === selectedTreatmentId) ?? null;
  const filteredPicker = availableSessions.filter((s) =>
    !pickerQuery.trim() ? true : s.serviceName.toLowerCase().includes(pickerQuery.trim().toLowerCase()),
  );

  const referrals = useQuery({
    queryKey: ["kh-affiliate-referrals", phone],
    enabled: !!phone,
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from("customers").select("*", { count: "exact", head: true }).eq("referred_by", phone);
        if (error) throw error;
        return count ?? 0;
      } catch (e) { console.warn("[CustomerHome] referrals", e); return 0; }
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
    } catch { toast.error("Không thể sao chép, vui lòng copy thủ công."); }
  }
  async function handleShare() {
    if (!link) return;
    if (navigator.share) {
      try { await navigator.share({ title: "Vita TH Pro", text: "Trải nghiệm dịch vụ cùng tôi tại Vita TH Pro!", url: link }); } catch { /* cancelled */ }
    } else { handleCopy(); }
  }

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-black text-brand-dark">Liệu trình của tôi</h1>
        <p className="text-sm text-ink-muted">
          Xin chào {fullName}, đây là danh sách liệu trình bạn đang sử dụng.
        </p>
      </div>

      {/* 2 CỘT: KHẢ DỤNG / ĐÃ SỬ DỤNG + ĐƠN HÀNG */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand/10 grid place-items-center text-brand-dark">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-black text-brand-dark">Liệu trình còn khả dụng</h3>
              <p className="text-xs text-ink-muted">Chọn để lấy mã QR check-in cho buổi tiếp theo.</p>
            </div>
            <span className="text-xs font-bold text-brand-dark bg-brand-soft rounded-full px-2.5 py-1">
              {availableSessions.length}
            </span>
          </div>

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
                      <span className="font-bold text-brand-dark">{selected.serviceName}</span>
                      <span className="text-ink-muted"> · Buổi #{selected.treatment.session_number}</span>
                    </>
                  ) : availableSessions.length === 0 ? (
                    <span className="text-ink-muted italic">Bạn chưa có buổi khả dụng</span>
                  ) : (
                    <span className="text-ink-muted">-- Chọn liệu trình để lấy mã QR --</span>
                  )}
                </span>
                <ChevronDown className="w-4 h-4 text-ink-muted" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0 w-[--radix-popover-trigger-width] bg-white z-50 shadow-md border border-hairline">
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
                  <div className="px-4 py-6 text-center text-xs text-ink-muted italic">Không tìm thấy liệu trình.</div>
                ) : (
                  filteredPicker.map((s) => (
                    <button
                      key={s.treatment.id}
                      type="button"
                      onClick={() => { setSelectedTreatmentId(s.treatment.id); setPickerOpen(false); setPickerQuery(""); }}
                      className="w-full text-left px-4 py-3 hover:bg-brand-soft/60 border-b border-hairline last:border-b-0"
                    >
                      <div className="text-sm font-bold text-ink">{s.serviceName}</div>
                      <div className="text-[11px] text-ink-muted mt-0.5">
                        Buổi tiếp theo: #{s.treatment.session_number}/{s.totalSessions} · còn {s.remaining} buổi
                      </div>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {selected ? (
            <div className="rounded-2xl border border-hairline bg-gradient-to-br from-brand-soft to-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-widest text-ink-muted flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Mã QR check-in
                  </div>
                  <div className="font-black text-brand-dark mt-1">{selected.serviceName}</div>
                  <div className="text-xs text-ink-muted mt-0.5">
                    Buổi #{selected.treatment.session_number} / {selected.totalSessions} · còn lại{" "}
                    <b className="text-brand-dark">{selected.remaining}</b> buổi
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedTreatmentId(null)} className="text-ink-muted hover:text-rose-600" aria-label="Bỏ chọn">
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
                    } catch { return selected.treatment.qr_code_id ?? ""; }
                  })()}
                  size={192}
                  level="H"
                  includeMargin={false}
                />
                <div className="mt-2 text-[10px] font-mono text-ink-muted">
                  #{selected.treatment.session_number} · {(selected.treatment.qr_code_id ?? "").slice(0, 8)}…
                </div>
              </div>
              <p className="mt-3 text-[11px] text-center text-ink-muted">Đưa mã này cho kỹ thuật viên để check-in buổi.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-hairline bg-[#fafcf7] p-6 text-center text-xs text-ink-muted">
              Chọn 1 liệu trình từ dropdown bên trên để hiển thị mã QR.
            </div>
          )}
        </div>

        {/* Đã sử dụng + Đơn hàng */}
        <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 grid place-items-center text-emerald-700">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wider">Đơn hàng</h3>
              <p className="text-xs text-ink-muted">Dịch vụ/sản phẩm đã mua & buổi đã sử dụng.</p>
            </div>
          </div>

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
                  <div key={u.id} className="flex items-center gap-2 rounded-xl border border-hairline bg-[#fafcf7] px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="flex-1 text-sm">
                      <span className="font-semibold text-ink">{u.serviceName}</span>{" "}
                      <span className="text-ink-muted">— Buổi #{u.session_number}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">{u.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-widest text-ink-muted font-semibold mb-2">
              Đơn hàng ({ordersQ.data?.length ?? 0})
            </div>
            {ordersQ.isLoading ? (
              <div className="rounded-xl border border-hairline bg-[#fafcf7] p-4 text-xs text-ink-muted italic text-center">Đang tải đơn hàng…</div>
            ) : (ordersQ.data ?? []).length === 0 ? (
              <div className="rounded-xl border border-hairline bg-[#fafcf7] p-4 text-xs text-ink-muted italic text-center">Bạn chưa có đơn hàng nào.</div>
            ) : (
              <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {(ordersQ.data ?? []).map((o) => {
                  const items = (orderItemsQ.data ?? []).filter((it) => it.order_id === o.id);
                  const displayName = items.length > 0
                    ? items.map((it) => (it.item_id ? catalogNameMap.get(it.item_id) : null) || "Sản phẩm / Dịch vụ").join(", ")
                    : o.service_id ? catalogNameMap.get(o.service_id) ?? "Đơn hàng" : "Đơn hàng";
                  const totalQty = items.length > 0
                    ? items.reduce((s, it) => s + (Number(it.quantity) || 0), 0)
                    : (o.quantity ?? 1);
                  const isPaid = o.status === "paid";
                  return (
                    <li 
                      key={o.id} 
                      onClick={() => setSelectedOrder(o)} 
                      className="rounded-xl border border-hairline px-3 py-2 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-400 hover:shadow-sm transition-all"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink truncate">{displayName}</div>
                        <div className="text-[10px] text-ink-muted">
                          #{o.order_code ?? o.id.slice(0, 6)} ·{" "}
                          {o.created_at ? new Date(o.created_at).toLocaleDateString("vi-VN") : ""} · SL {totalQty}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-brand-dark">{money(Number(o.total_amount ?? 0))}</div>
                        <span className={"text-[10px] px-2 py-0.5 rounded-full font-bold " + (isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800")}>
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

      {/* AFFILIATE */}
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
              <Link2 className="w-5 h-5" /> Link giới thiệu của bạn
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
                  <div className="flex-1 rounded-xl border border-hairline bg-[#f7faf7] px-4 py-3 font-mono text-sm break-all">{link}</div>
                  <Button onClick={handleCopy} className="sm:w-auto">
                    <Copy className="w-4 h-4" /> {copied ? "Đã sao chép" : "Copy Link"}
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="sm:w-auto">
                    <Share2 className="w-4 h-4" /> Chia sẻ
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
              <Users2 className="w-5 h-5" /> Đã giới thiệu thành công
            </div>
            <div className="text-5xl font-black leading-none mt-3">
              {referrals.isLoading ? "…" : (referrals.data ?? 0)}
            </div>
            <div className="text-white/80 text-sm mt-2">lượt đặt lịch qua link của bạn</div>
          </div>
        </div>
      </section>

      {/* HOA HỒNG & ĐỔI THƯỞNG */}
      <section className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 grid place-items-center text-amber-700">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-brand-dark">Hoa hồng của tôi</h3>
              <p className="text-xs text-ink-muted">Tích luỹ từ chương trình giới thiệu.</p>
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-white border border-hairline p-5">
            <div className="text-[11px] uppercase tracking-widest text-ink-muted font-bold">Số dư hoa hồng</div>
            <div className="text-4xl font-black text-brand-dark mt-2">{money(0)}</div>
            <div className="text-xs text-ink-muted mt-2">
              Cần tối thiểu {money(200000)} để đổi thưởng hoặc rút về ví.
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Tháng này", value: money(0) },
              { label: "Tháng trước", value: money(0) },
              { label: "Tổng", value: money(0) },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-hairline p-3">
                <div className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">{c.label}</div>
                <div className="text-sm font-black text-brand-dark mt-1">{c.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-100 grid place-items-center text-rose-600">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-brand-dark">Đổi thưởng</h3>
              <p className="text-xs text-ink-muted">Sử dụng điểm/hoa hồng để đổi ưu đãi.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: "Voucher 200K", cost: "200 điểm", color: "from-rose-100 to-white" },
              { name: "Buổi trị liệu miễn phí", cost: "500 điểm", color: "from-emerald-100 to-white" },
            ].map((r) => (
              <div key={r.name} className={`rounded-xl border border-hairline bg-gradient-to-br ${r.color} p-4 flex flex-col gap-2`}>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-dark" />
                  <div className="font-bold text-brand-dark text-sm">{r.name}</div>
                </div>
                <div className="text-xs text-ink-muted">{r.cost}</div>
                <Button size="sm" variant="outline" disabled className="mt-auto">Sắp mở</Button>
              </div>
            ))}
          </div>
          <div className="mt-5">
            <div className="text-[11px] uppercase tracking-widest text-ink-muted font-bold mb-2">Lịch sử đổi thưởng</div>
            <div className="rounded-xl border border-dashed border-hairline p-4 text-center text-xs text-ink-muted italic">
              Chưa có giao dịch đổi thưởng nào.
            </div>
          </div>
        </div>
      </section>

      {/* POPUP XEM CHI TIẾT ĐƠN HÀNG */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-brand-dark border-b pb-3">
              Chi tiết Đơn hàng
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-5 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink-muted font-medium">Mã đơn:</span>
                <span className="font-bold text-brand-dark">#{selectedOrder.order_code ?? selectedOrder.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink-muted font-medium">Ngày đặt:</span>
                <span className="font-bold text-brand-dark">
                  {selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleString("vi-VN") : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-ink-muted font-medium">Trạng thái:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedOrder.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedOrder.status === 'paid' ? 'Đã thanh toán' : (selectedOrder.status ?? "Đang xử lý")}
                </span>
              </div>

              <div className="mt-6">
                <h4 className="text-xs uppercase tracking-widest text-ink-muted font-bold mb-3">Sản phẩm / Dịch vụ</h4>
                <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  
                  {/* LUỒNG CHUẨN: Lấy dữ liệu chi tiết từng sản phẩm trong đơn */}
                  {(orderItemsQ.data ?? [])
                    .filter((it) => it.order_id === selectedOrder.id)
                    .map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-brand-dark">
                            {item.name || (item.item_id ? catalogNameMap.get(item.item_id) : null) || "Sản phẩm / Dịch vụ"}
                          </p>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {item.quantity} x {money(Number(item.unit_price ?? 0))}
                          </p>
                        </div>
                        <span className="font-bold text-sm text-brand-dark">
                          {money(Number(item.quantity ?? 0) * Number(item.unit_price ?? 0))}
                        </span>
                      </div>
                    ))}

                  {/* LUỒNG DỰ PHÒNG: Đơn hàng cũ chưa có order_items */}
                  {(orderItemsQ.data ?? []).filter((it) => it.order_id === selectedOrder.id).length === 0 && (
                     <div className="flex justify-between items-start gap-4">
                       <div className="flex-1">
                         <p className="text-sm font-semibold text-brand-dark">
                            {selectedOrder.service_id ? catalogNameMap.get(selectedOrder.service_id) ?? "Sản phẩm / Dịch vụ" : "Đơn hàng"}
                         </p>
                         <p className="text-xs text-ink-muted">Số lượng: {selectedOrder.quantity ?? 1}</p>
                       </div>
                       <span className="font-bold text-sm text-brand-dark">{money(Number(selectedOrder.total_amount ?? 0))}</span>
                     </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-2">
                <span className="text-base font-bold text-brand-dark">Tổng cộng:</span>
                <span className="text-xl font-black text-rose-600">
                  {money(Number(selectedOrder.total_amount ?? 0))}
                </span>
              </div>

              <Button onClick={() => setSelectedOrder(null)} className="w-full mt-4 bg-gray-100 text-gray-800 hover:bg-gray-200">
                Đóng
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
