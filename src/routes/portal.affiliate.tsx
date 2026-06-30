import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Link2, Users2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portal/affiliate")({
  component: AffiliatePage,
});

function AffiliatePage() {
  const { email, fullName } = useAuth();
  const [copied, setCopied] = useState(false);

  const customer = useQuery({
    queryKey: ["customer-by-email", email],
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

  const phone = customer.data?.phone ?? "";

  const referrals = useQuery({
    queryKey: ["referrals-count", phone],
    enabled: !!phone,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("referrer_phone", phone);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = phone ? `${origin}/?ref=${encodeURIComponent(phone)}` : "";

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

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-brand-dark">Tiếp thị liên kết</h1>
        <p className="text-sm text-ink-muted">
          Chia sẻ link giới thiệu của bạn, {fullName ?? email}. Mỗi lượt đặt lịch qua link sẽ được ghi nhận tự động.
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
    </div>
  );
}
