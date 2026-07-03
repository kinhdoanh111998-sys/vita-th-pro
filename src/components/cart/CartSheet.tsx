import { useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore, useCartTotals } from "@/lib/cart/useCartStore";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const fmt = (n: number) => n.toLocaleString("vi-VN") + " đ";

export function CartSheet({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { lines, totalAmount, totalQty } = useCartTotals();
  const { inc, dec, remove, clear } = useCartStore();

  const handleCheckout = () => {
    onOpenChange(false);
    navigate({ to: "/checkout" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col bg-white">
        <SheetHeader>
          <SheetTitle className="text-brand-dark">
            Giỏ hàng ({totalQty})
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4">
          {lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 text-gray-500">
              <ShoppingBag className="w-14 h-14 mb-3 text-gray-300" />
              <p className="text-sm">Giỏ hàng trống. Chọn sản phẩm để bắt đầu.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {lines.map((l) => (
                <li
                  key={l.id}
                  className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {l.image ? (
                      <img src={l.image} alt={l.name} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold line-clamp-2 text-gray-900">
                        {l.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => remove(l.id)}
                        aria-label="Xoá"
                        className="text-gray-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          type="button"
                          onClick={() => dec(l.id)}
                          className="h-7 w-7 grid place-items-center hover:bg-gray-50"
                          aria-label="Giảm"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {l.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => inc(l.id)}
                          className="h-7 w-7 grid place-items-center hover:bg-gray-50"
                          aria-label="Tăng"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-brand-primary">
                        {fmt(l.qty * l.price)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <SheetFooter className="border-t border-gray-100 pt-4 space-y-3 sm:flex-col sm:items-stretch sm:space-x-0">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tạm tính</span>
              <span className="font-black text-brand-primary text-lg">
                {fmt(totalAmount)}
              </span>
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full h-12 bg-brand-primary hover:bg-brand-primary-dark text-white font-bold"
            >
              Tiến hành thanh toán
            </Button>
            <button
              type="button"
              onClick={() => clear()}
              className="text-xs text-gray-500 hover:text-rose-600"
            >
              Xoá tất cả
            </button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
