import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

interface Props {
  /** Path bắt đầu bằng '/', ví dụ '/products/abc' */
  path: string;
  /** Ẩn label, chỉ hiện icon (dạng nút tròn floating) */
  iconOnly?: boolean;
  className?: string;
}

export function ShareRefButton({ path, iconOnly = false, className = "" }: Props) {
  const { email } = useAuth();
  const [copied, setCopied] = useState(false);

  // Lấy customer_id của user đang đăng nhập (nếu có)
  const { data: customerId } = useQuery({
    queryKey: ["share-ref-customer-id", email],
    enabled: !!email,
    queryFn: async () => {
      const { data } = await supabase
        .from("customers")
        .select("id")
        .eq("email", email!)
        .maybeSingle();
      return (data?.id as string) ?? null;
    },
    staleTime: 5 * 60_000,
  });

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = customerId
        ? `${origin}${path}?ref=${encodeURIComponent(customerId)}`
        : `${origin}${path}`;
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ title: "VITA TH Pro", url });
          return;
        } catch {
          /* user cancelled → fall through to copy */
        }
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Đã sao chép link giới thiệu!");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Không thể sao chép link");
    }
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleShare}
        aria-label="Chia sẻ"
        className={
          "w-9 h-9 rounded-full bg-white/95 backdrop-blur border border-gray-200 shadow-md grid place-items-center text-emerald-600 hover:text-emerald-700 hover:bg-white transition " +
          className
        }
      >
        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={
        "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 h-10 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 " +
        className
      }
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      <span>{copied ? "Đã copy" : "Chia sẻ"}</span>
    </button>
  );
}
