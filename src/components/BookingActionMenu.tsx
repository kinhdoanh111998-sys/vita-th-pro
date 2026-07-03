import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MessageCircle, Search } from "lucide-react";
import { useSystemSettings } from "@/lib/useSystemSettings";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  trigger: ReactNode;
  align?: "start" | "center" | "end";
}

/**
 * Popover 2 tùy chọn cho nút "Đặt lịch":
 *  - Liên hệ Zalo  → Zalo OA URL (system_settings.zalo_oa_url, fallback https://zalo.me/0988000888)
 *  - Tra cứu liệu trình → /lookup
 */
export function BookingActionMenu({ trigger, align = "end" }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: sys } = useSystemSettings();
  const zaloUrl =
    (sys as { zalo_oa_url?: string | null } | null | undefined)?.zalo_oa_url ||
    sys?.zalo_link ||
    "https://zalo.me/0988000888";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={8}
        className="w-56 p-2 bg-white border border-gray-200 shadow-xl z-[70]"
      >
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#0068FF] hover:bg-[#e6f0ff]"
        >
          <MessageCircle className="w-4 h-4" />
          Liên hệ Zalo
        </a>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            navigate({ to: "/lookup" });
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          <Search className="w-4 h-4" />
          Tra cứu liệu trình
        </button>
      </PopoverContent>
    </Popover>
  );
}
