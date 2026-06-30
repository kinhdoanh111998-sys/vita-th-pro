import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, CheckCircle2, Copy, Link2, Users2, Share2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import logo from "@/assets/vita-th-pro-logo.png";

export const Route = createFileRoute("/khach-hang")({
  component: KhachHangPage,
});

type Treatment = {
  id: string;
  package_name: string | null;
  total_sessions: number | null;
  used_sessions: number | null;
  status: string | null;
  created_at: string | null;
};

function KhachHangPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [copied, setCopied] = useState(false);

  // In-page session check — bypass any AuthGuard
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

  const customer = useQuery({
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

  const customerId = customer.data?.id ?? null;
  const fullName = customer.data?.name ?? email;
  const phone = customer.data?.phone ?? "";

  const treatments = useQuery({
    queryKey: ["kh-my-treatments", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("id, package_name, total_sessions, used_sessions, status, created_at")
        .eq("customer_id", customerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Treatment[];
    },
  });

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
        {/* Treatments */}
        <section>
          <div className="mb-6">
            <h1 className="text-2xl font-black text-brand-dark">Liệu trình của tôi</h1>
            <p className="text-sm text-ink-muted">
              Xin chào {fullName}, đây là danh sách liệu trình bạn đang sử dụng.
            </p>
          </div>

          {customer.isLoading || treatments.isLoading ? (
            <div className="text-ink-muted">Đang tải dữ liệu...</div>
          ) : !customer.data ? (
            <div className="rounded-2xl border border-hairline bg-white p-6 text-ink-muted">
              Chưa tìm thấy hồ sơ khách hàng cho tài khoản này. Vui lòng liên hệ Spa để được liên kết tài khoản.
            </div>
          ) : (treatments.data ?? []).length === 0 ? (
            <div className="rounded-2xl border border-hairline bg-white p-6 text-ink-muted">
              Bạn chưa có liệu trình nào.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(treatments.data ?? []).map((t) => {
                const total = Number(t.total_sessions ?? 0);
                const used = Number(t.used_sessions ?? 0);
                const remaining = Math.max(total - used, 0);
                const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
                const done = remaining === 0 && total > 0;
                return (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-hairline bg-white p-5 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 grid place-items-center text-brand-dark">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-ink leading-tight">
                            {t.package_name ?? "Liệu trình"}
                          </div>
                          <div className="text-[11px] uppercase tracking-wider text-ink-muted">
                            {t.status ?? "active"}
                          </div>
                        </div>
                      </div>
                      {done && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <Stat label="Tổng" value={total} />
                      <Stat label="Đã dùng" value={used} />
                      <Stat label="Còn lại" value={remaining} highlight />
                    </div>

                    <div>
                      <Progress value={pct} className="h-2" />
                      <div className="text-[11px] text-ink-muted mt-1 text-right">{pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Affiliate */}
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

              {customer.isLoading ? (
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

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl px-2 py-2 ${highlight ? "bg-brand/10 text-brand-dark" : "bg-[#f3f7f3] text-ink"}`}>
      <div className="text-lg font-black leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
