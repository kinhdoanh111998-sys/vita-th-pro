import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItemType = "product" | "service";

export interface CartLine {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  type: CartItemType;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  add: (item: Omit<CartLine, "qty">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.id === item.id);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.id === item.id ? { ...l, qty: l.qty + qty } : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...item, qty }] };
        }),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l))
            .filter((l) => l.qty > 0),
        })),
      inc: (id) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)),
        })),
      dec: (id) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l))
            .filter((l) => l.qty > 0),
        })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "vita-cart-v1",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? window.localStorage : undefined as unknown as Storage)),
    },
  ),
);

export function useCartTotals() {
  const lines = useCartStore((s) => s.lines);
  const totalQty = lines.reduce((n, l) => n + l.qty, 0);
  const totalAmount = lines.reduce((n, l) => n + l.qty * (l.price || 0), 0);
  return { totalQty, totalAmount, lines };
}
