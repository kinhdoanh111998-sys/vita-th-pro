import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Copy, Share2, Users2, Link2, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const money = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function AffiliateCard() {
  const { session, email } = useAuth();
  const uid = session?.user.id ?? null;
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(false);

  // Lấy ref_code (6 ký tự) từ hồ sơ khách hàng.
  const meQ = useQuery({
    queryKey: ["portal-aff-me", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, ref_code")
        .eq("id", uid!)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; ref_code: string | null } | null;
    },
  });

  const refCode = meQ.data?.ref_code ?? "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = refCode ? `${origin}/?ref=${encodeURIComponent(refCode)}` : "";

  // Số khách đã giới thiệu thành công (referred_by = customer id của tôi)
  const referralsQ = useQuery({
    queryKey: ["portal-aff-referrals", uid],
    enabled: !!uid,
    queryFn: async () => {
      try {
        const { count, error } = await supabase
          .from("customers")
          .select("id", { count: "exact", head: true })
          .eq("referred_by", uid!);
        if (error) throw error;
        return count ?? 0;
      } catch (e) {
        console.warn("[AffiliateCard] referrals error", e);
        return 0;
      }
    },
  });


  // Tổng hoa hồng affiliate (tạm tính) — từ bảng commissions, type = 'affiliate'
  const commissionQ = useQuery({
    queryKey: ["portal-aff-commission", uid],
    enabled: !!uid,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("commissions")
          .select("amount")
          .eq("staff_id", uid!)
          .eq("commission_type", "affiliate");
        if (error) throw error;
        return (data ?? []).reduce((s, r) => s + Number(r.amount ?? 0), 0);
      } catch (e) {
        console.warn("[AffiliateCard] commission error", e);
        return 0;
      }
    },
  });

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
        await navigator.share({ title: "Vita TH Pro", text: "Trải nghiệm dịch vụ cùng tôi tại Vita TH Pro!", url: link });
      } catch { /* cancelled */ }
    } else handleCopy();
  }

  return (
    <div className="rounded-2xl border border-hairline bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-brand/10 grid place-items-center text-brand-dark">
          <Link2 className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-brand-dark">Tiếp thị liên kết</h3>
          <p className="text-xs text-ink-muted">Chia sẻ link cá nhân để nhận hoa hồng.</p>
        </div>
      </div>

      {!refCode ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 p-4 text-sm">
          Chưa xác định được mã giới thiệu.
        </div>
      ) : (
        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-start">
          {/* Cột trái: link + stats */}
          <div className="space-y-3 min-w-0">
            <div className="flex flex-col gap-2">
              <div className="rounded-xl border border-hairline bg-[#f7faf7] px-3 py-2.5 font-mono text-xs break-all">
                {link}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCopy} size="sm" className="flex-1">
                  <Copy className="w-4 h-4" /> {copied ? "Đã copy" : "Copy Link"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4" /> Chia sẻ
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-hairline bg-gradient-to-br from-brand to-brand-dark text-white p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-90">
                  <Users2 className="w-3.5 h-3.5" /> Đã giới thiệu
                </div>
                <div className="text-3xl font-black leading-none mt-2">
                  {referralsQ.isLoading ? "…" : (referralsQ.data ?? 0)}
                </div>
                <div className="text-[10px] opacity-80 mt-1">khách hàng</div>
              </div>
              <div className="rounded-xl border border-hairline bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-90">
                  <ShieldCheck className="w-3.5 h-3.5" /> Hoa hồng
                </div>
                <div className="text-xl font-black leading-tight mt-2">
                  {commissionQ.isLoading ? "…" : money(commissionQ.data ?? 0)}
                </div>
                <div className="text-[10px] opacity-80 mt-1">tạm tính</div>
              </div>
            </div>
          </div>

          {/* Cột phải: QR bấm phóng to */}
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="rounded-2xl border border-hairline bg-white p-3 hover:border-brand-primary transition grid place-items-center"
            aria-label="Phóng to mã QR"
          >
            <QRCodeCanvas value={link || "https://vitath.pro"} size={128} level="H" />
            <div className="text-[10px] text-ink-muted mt-1.5">Bấm để phóng to</div>
          </button>
        </div>
      )}

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-sm bg-white">
          <DialogTitle className="text-center font-black text-brand-dark">
            Mã QR giới thiệu của bạn
          </DialogTitle>
          <div className="grid place-items-center p-4">
            <QRCodeCanvas value={link || "https://vitath.pro"} size={280} level="H" />
          </div>
          <p className="text-xs text-center text-ink-muted break-all px-4">{link}</p>
          <div className="flex justify-center pb-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(false)}>
              <X className="w-4 h-4" /> Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
