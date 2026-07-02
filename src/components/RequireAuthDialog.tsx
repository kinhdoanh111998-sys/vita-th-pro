import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogIn, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

type Intent = "booking" | "order" | "comment" | "voucher" | "generic";

const INTENT_LABEL: Record<Intent, { title: string; desc: string }> = {
  booking:  { title: "Đăng nhập để đặt lịch",   desc: "Đăng nhập để tiếp tục đặt lịch hẹn. Chỉ mất vài giây với Zalo." },
  order:    { title: "Đăng nhập để mua hàng",   desc: "Đăng nhập để giữ giỏ hàng & theo dõi đơn hàng của bạn." },
  comment:  { title: "Đăng nhập để bình luận",  desc: "Đăng nhập nhanh để tham gia thảo luận cùng chúng tôi." },
  voucher:  { title: "Đăng nhập để nhận ưu đãi",desc: "Đăng nhập để lưu voucher vào tài khoản của bạn." },
  generic:  { title: "Cần đăng nhập",           desc: "Bạn cần đăng nhập để tiếp tục thao tác này." },
};

export function RequireAuthDialog({
  open, onOpenChange, intent = "generic",
}: { open: boolean; onOpenChange: (v: boolean) => void; intent?: Intent }) {
  const { title, desc } = INTENT_LABEL[intent];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-brand-dark">{title}</DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5 pt-2">
          <a
            href="/api/public/zalo/authorize"
            className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-[#0068FF] hover:bg-[#0052cc] text-white font-bold text-sm transition-colors"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M12.49 10.2722v-.4496h1.3467v6.3218h-.7704a.576.576 0 0 1-.5763-.5729l-.0006.0005a3.273 3.273 0 0 1-1.9372.6321c-1.8138 0-3.2844-1.4697-3.2844-3.2823 0-1.8125 1.4706-3.2822 3.2844-3.2822a3.273 3.273 0 0 1 1.9378.6326zM6.9188 6.7896v.4482c0 .3159-.0906.6254-.2612.8914L2.7178 14.63h3.9502v.7682a.5764.5764 0 0 1-.5767.5761H.4133v-.4548c0-.3121.0879-.6182.2536-.8827l3.9598-6.5127H.665V7.366A.576.576 0 0 1 1.2417 6.79h5.6771zm10.6537 9.3733a3.2723 3.2723 0 0 1-3.2794-3.2666 3.2723 3.2723 0 0 1 3.2794-3.2667 3.2723 3.2723 0 0 1 3.2795 3.2667 3.2723 3.2723 0 0 1-3.2795 3.2666z"/>
            </svg>
            Đăng nhập nhanh bằng Zalo
          </a>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="h-11">
              <Link to="/dang-ky"><UserPlus className="w-4 h-4 mr-1" /> Đăng ký</Link>
            </Button>
            <Button asChild variant="outline" className="h-11">
              <Link to="/login"><LogIn className="w-4 h-4 mr-1" /> Đăng nhập</Link>
            </Button>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-full text-xs text-ink-muted hover:text-brand-dark pt-1"
          >
            Để sau
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Hook tiện dụng: bọc action → nếu chưa đăng nhập thì mở dialog. */
export function useRequireAuth(intent: Intent = "generic") {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const dialog = <RequireAuthDialog open={open} onOpenChange={setOpen} intent={intent} />;
  const guard = (action: () => void) => {
    if (!session) { setOpen(true); return false; }
    action();
    return true;
  };
  return { isAuthed: !!session, guard, dialog, openDialog: () => setOpen(true) };
}
