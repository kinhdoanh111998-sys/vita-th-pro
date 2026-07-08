import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartTotals } from "@/lib/cart/useCartStore";
import { CartSheet } from "@/components/cart/CartSheet";
// 1. Thêm import useLocation từ TanStack Router
import { useLocation } from "@tanstack/react-router";

interface Props {
  variant?: "header" | "floating";
  className?: string;
}

export function CartButton({ variant = "header", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const { totalQty } = useCartTotals();
  
  // 2. Lấy thông tin đường dẫn hiện tại
  const location = useLocation();

  // 3. Khai báo các trang KHÔNG ĐƯỢC phép hiện giỏ hàng nổi
  const hideFloatingCartRoutes = ['/app/account', '/app/notifications', '/portal'];
  const shouldHideFloating = hideFloatingCartRoutes.some(route => location.pathname.startsWith(route));

  const badgeClass =
    "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-scaleIn";

  if (variant === "floating") {
    // 4. Nếu đang ở các trang quản lý cá nhân -> Ẩn hoàn toàn nút Floating
    if (shouldHideFloating) return null;

    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Giỏ hàng"
          className={`fixed top-4 right-4 z-40 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center ${className}`}
        >
          <ShoppingCart className="w-5 h-5 text-gray-700" />
          {totalQty > 0 && (
            <span className={badgeClass}>{totalQty > 99 ? "99+" : totalQty}</span>
          )}
        </button>
        <CartSheet open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Giỏ hàng"
        className={`relative p-2 flex items-center justify-center ${className}`}
      >
        <ShoppingCart className="w-5 h-5 text-gray-700" />
        {totalQty > 0 && (
          <span className={badgeClass}>{totalQty > 99 ? "99+" : totalQty}</span>
        )}
      </button>
      <CartSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
