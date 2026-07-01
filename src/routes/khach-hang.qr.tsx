import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeft, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/khach-hang/qr")({
  component: MyQrPage,
});

type Treatment = {
  id: string;
  order_id: string;
  session_number: number;
  status: string;
  qr_code_id: string;
};
type Order = { id: string; service_id: string; quantity: number };
type Service = { id: string; name: string; default_sessions: number | null };

function MyQrPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const e = data.session?.user?.email ?? null;
      if (!e) {
        navigate({ to: "/login", replace: true });
        return;
      }
      setEmail(e);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, [navigate]);

  const customer = useQuery({
    queryKey: ["kh-qr-customer", email],
    enabled: !!email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id,name")
        .eq("email", email!)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; name: string | null } | null;
    },
  });

  const customerId = customer.data?.id ?? null;

  const treatmentsQ = useQuery({
    queryKey: ["kh-qr-treatments", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("id,order_id,session_number,status,qr_code_id")
        .eq("customer_id", customerId!)
        .order("order_id")
        .order("session_number");
      if (error) throw error;
      return (data ?? []) as Treatment[];
    },
  });

  const orderIds = Array.from(new Set((treatmentsQ.data ?? []).map((t) => t.order_id)));
  const ordersQ = useQuery({
    queryKey: ["kh-qr-orders", orderIds.join(",")],
    enabled: orderIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,service_id,quantity")
        .in("id", orderIds);
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  const serviceIds = Array.from(new Set((ordersQ.data ?? []).map((o) => o.service_id)));
  const servicesQ = useQuery({
    queryKey: ["kh-qr-services", serviceIds.join(",")],
    enabled: serviceIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id,name,default_sessions")
        .in("id", serviceIds);
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });

  const orderMap = new Map((ordersQ.data ?? []).map((o) => [o.id, o]));
  const serviceMap = new Map((servicesQ.data ?? []).map((s) => [s.id, s]));

  const treatments = treatmentsQ.data ?? [];
  const pending = treatments.filter((t) => t.status === "pending");
  const completed = treatments.filter((t) => t.status !== "pending");

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-muted">Đang kiểm tra phiên đăng nhập…</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7faf5] to-white">
      <div className="mx-auto max-w-[520px] px-4 py-6">
        <Link
          to="/khach-hang"
          className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-brand-dark mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại hồ sơ
        </Link>

        <div className="rounded-3xl bg-gradient-to-br from-brand-dark to-emerald-700 text-white p-6 shadow-xl">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
            <ShieldCheck className="w-4 h-4" /> Mã QR check-in
          </div>
          <div className="mt-2 text-2xl font-black">Xin chào, {customer.data?.name ?? "quý khách"}!</div>
          <p className="text-sm opacity-90 mt-1">
            Đưa mã QR này cho kỹ thuật viên trước mỗi buổi để tự động trừ 1 buổi liệu trình.
          </p>
        </div>

        {treatmentsQ.isLoading || customer.isLoading ? (
          <div className="mt-6 text-ink-muted">Đang tải liệu trình…</div>
        ) : !customer.data ? (
          <div className="mt-6 rounded-2xl border border-hairline bg-white p-6 text-ink-muted">
            Chưa liên kết hồ sơ khách hàng. Vui lòng liên hệ Spa.
          </div>
        ) : pending.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-hairline bg-white p-6 text-ink-muted text-center">
            <Sparkles className="w-6 h-6 mx-auto text-brand-dark mb-2" />
            Bạn chưa có buổi nào đang chờ. Vui lòng liên hệ Spa để đặt liệu trình.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {pending.map((t) => {
              const order = orderMap.get(t.order_id);
              const svc = order ? serviceMap.get(order.service_id) : null;
              const totalSessions = order && svc
                ? Math.max(order.quantity, 1) * Math.max(svc.default_sessions ?? 1, 1)
                : null;
              return (
                <div
                  key={t.id}
                  className="rounded-3xl bg-white shadow-md border border-hairline overflow-hidden"
                >
                  <div className="p-5 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-widest text-ink-muted">
                        Buổi #{t.session_number}
                        {totalSessions ? ` / ${totalSessions}` : ""}
                      </div>
                      <div className="font-extrabold text-ink mt-1">
                        {svc?.name ?? "Liệu trình"}
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold">
                      Chờ check-in
                    </span>
                  </div>
                  <div className="grid place-items-center bg-[#fafcf7] py-6">
                    <div className="p-3 rounded-2xl bg-white shadow ring-1 ring-hairline">
                      <QRCodeCanvas
                        value={t.qr_code_id}
                        size={192}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <div className="mt-3 text-[10px] font-mono text-ink-muted">
                      {t.qr_code_id.slice(0, 8)}…{t.qr_code_id.slice(-4)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {completed.length > 0 && (
          <div className="mt-8">
            <div className="text-xs uppercase tracking-widest text-ink-muted font-semibold mb-3">
              Đã hoàn thành
            </div>
            <div className="space-y-2">
              {completed.map((t) => {
                const order = orderMap.get(t.order_id);
                const svc = order ? serviceMap.get(order.service_id) : null;
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 rounded-2xl bg-white/60 border border-hairline p-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-ink">
                        {svc?.name ?? "Liệu trình"} — Buổi #{t.session_number}
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      Đã dùng
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
