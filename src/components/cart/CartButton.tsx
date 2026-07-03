import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { useCartTotals } from "@/lib/cart/useCartStore";
import { CartSheet } from "@/components/cart/CartSheet";

interface Props {
  variant?: "header" | "floating";
  className?: string;
}

export function CartButton({ variant = "header", className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const { totalQty } = useCartTotals();

  const base =
    variant === "floating"
      ? "fixed top-4 right-4 z-40 w-11 h-11 rounded-full bg-white shadow-lg border border-gray-200"
      : "relative inline-flex items-center justify-center h-10 w-10 rounded-lg border border-gray-200 hover:border-emerald-500 hover:text-emerald-700 bg-white";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Giỏ hàng"
        className={`${base} ${className}`}
      >
        <ShoppingCart className="w-5 h-5 text-gray-700" />
        {totalQty > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold grid place-items-center border-2 border-white">
            {totalQty > 99 ? "99+" : totalQty}
          </span>
        )}
      </button>
      <CartSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
