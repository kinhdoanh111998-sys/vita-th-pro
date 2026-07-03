import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, ImageIcon, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useCartStore } from "@/lib/cart/useCartStore";
import { formatVND, type Combo } from "@/lib/useCombos";

function comboImage(c: Combo): string | null {
  if (c.image_url) return c.image_url;
  const first = c.items.find(
    (i) => i.service.image_url || (i.service.image_urls?.length ?? 0) > 0,
  );
  if (!first) return null;
  return (
    first.service.image_url ??
    first.service.image_urls?.[0] ??
    null
  );
}

interface Props {
  combo: Combo;
}

export function ComboCard({ combo }: Props) {
  const navigate = useNavigate();
  const add = useCartStore((s) => s.add);
  const [detailOpen, setDetailOpen] = useState(false);
  const img = comboImage(combo);

  const buyCombo = () => {
    if (combo.items.length === 0) {
      toast.info("Combo này chưa có sản phẩm/dịch vụ.");
      return;
    }
    // Bung combo thành các item thành phần, phân bổ mức giảm theo tỉ lệ giá.
    const ratio =
      combo.basePrice > 0 ? combo.finalPrice / combo.basePrice : 1;
    combo.items.forEach((it) => {
      const p =
        it.service.sale_price && it.service.sale_price > 0
          ? Number(it.service.sale_price)
          : it.service.price
            ? Number(it.service.price)
            : 0;
      const unit = Math.max(0, Math.round(p * ratio));
      const image =
        it.service.image_url ??
        it.service.image_urls?.[0] ??
        null;
      add(
        {
          id: it.service.id,
          name: `[Combo ${combo.name}] ${it.service.name}`,
          price: unit,
          image,
          type: it.service.type,
        },
        it.quantity,
      );
    });
    toast.success(`Đã thêm combo "${combo.name}" vào giỏ hàng.`);
    navigate({ to: "/checkout" });
  };

  const products = combo.items.filter((i) => i.service.type === "product");
  const services = combo.items.filter((i) => i.service.type === "service");

  return (
    <>
      <article className="group relative rounded-[22px] overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/30 border border-emerald-100 shadow-[0_8px_28px_rgba(21,89,42,0.08)] flex flex-col transition-all hover:shadow-[0_16px_40px_rgba(21,89,42,0.14)] hover:-translate-y-0.5">
        {/* Ribbon */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-white text-[11px] font-bold px-2.5 py-1 shadow">
            <Sparkles className="w-3 h-3" /> Combo Tiết Kiệm
          </span>
        </div>
        {combo.savedAmount > 0 && (
          <div className="absolute top-3 right-3 z-10 rounded-full bg-rose-600 text-white text-xs font-bold px-2.5 py-1 shadow">
            −{formatVND(combo.savedAmount)}
          </div>
        )}

        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="relative aspect-[4/3] bg-gradient-to-br from-emerald-50 to-white border-b border-emerald-100 overflow-hidden"
        >
          {img ? (
            <img
              src={img}
              alt={combo.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-emerald-200">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}
        </button>

        <div className="p-4 md:p-5 flex flex-col gap-2 flex-1">
          {combo.headline && (
            <span className="text-[11px] uppercase tracking-wide font-bold text-emerald-700">
              {combo.headline}
            </span>
          )}
          <h3 className="text-[16px] md:text-[17px] font-bold leading-snug text-gray-900 line-clamp-2">
            {combo.name}
          </h3>
          {combo.subtitle && (
            <p className="text-sm text-gray-500 line-clamp-2">
              {combo.subtitle}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px]">
            {products.length > 0 && (
              <span className="bg-blue-50 text-blue-700 rounded-full px-2 py-0.5 font-semibold">
                {products.length} sản phẩm
              </span>
            )}
            {services.length > 0 && (
              <span className="bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 font-semibold">
                {services.length} dịch vụ
              </span>
            )}
          </div>

          <div className="mt-auto pt-3 flex items-end justify-between gap-2 border-t border-emerald-50">
            <div>
              {combo.basePrice > combo.finalPrice && (
                <div className="text-xs text-gray-400 line-through">
                  {formatVND(combo.basePrice)}
                </div>
              )}
              <div className="text-lg md:text-xl font-black text-emerald-700">
                {formatVND(combo.finalPrice)}
              </div>
            </div>
            <button
              onClick={() => setDetailOpen(true)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Xem chi tiết
            </button>
          </div>
        </div>
      </article>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-white text-[11px] font-bold px-2.5 py-1">
                <Sparkles className="w-3 h-3" /> Combo Tiết Kiệm
              </span>
            </div>
            <DialogTitle className="text-xl md:text-2xl">
              {combo.name}
            </DialogTitle>
            {combo.subtitle && (
              <DialogDescription>{combo.subtitle}</DialogDescription>
            )}
          </DialogHeader>

          {img && (
            <div className="rounded-xl overflow-hidden border border-emerald-100">
              <img src={img} alt={combo.name} className="w-full object-cover max-h-72" />
            </div>
          )}

          {combo.description && (
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: combo.description }}
            />
          )}

          <div className="space-y-4">
            {products.length > 0 && (
              <ComboItemList
                title="Sản phẩm trong combo"
                tone="blue"
                items={products}
              />
            )}
            {services.length > 0 && (
              <ComboItemList
                title="Dịch vụ trong combo"
                tone="emerald"
                items={services}
              />
            )}
          </div>

          <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 p-4 flex items-end justify-between flex-wrap gap-3">
            <div>
              {combo.basePrice > combo.finalPrice && (
                <div className="text-sm text-gray-400 line-through">
                  {formatVND(combo.basePrice)}
                </div>
              )}
              <div className="text-2xl font-black text-emerald-700">
                {formatVND(combo.finalPrice)}
              </div>
              {combo.savedAmount > 0 && (
                <div className="text-xs text-rose-600 font-semibold">
                  Tiết kiệm {formatVND(combo.savedAmount)}
                </div>
              )}
            </div>
            <button
              onClick={buyCombo}
              className="h-11 px-5 rounded-full bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 inline-flex items-center gap-2 shadow"
            >
              <ShoppingBag className="w-4 h-4" />
              {combo.hasService && !combo.hasProduct
                ? "Đặt lịch Combo"
                : "Mua Combo"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ComboItemList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "blue" | "emerald";
  items: Combo["items"];
}) {
  const toneCls =
    tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : "bg-emerald-50 text-emerald-700";
  return (
    <div>
      <h4 className="text-sm font-bold text-gray-900 mb-2">{title}</h4>
      <ul className="divide-y border rounded-xl overflow-hidden">
        {items.map((it) => {
          const image =
            it.service.image_url ?? it.service.image_urls?.[0] ?? null;
          const p =
            it.service.sale_price && it.service.sale_price > 0
              ? it.service.sale_price
              : it.service.price;
          return (
            <li
              key={it.service_id}
              className="flex items-center gap-3 p-3 bg-white"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border shrink-0">
                {image ? (
                  <img
                    src={image}
                    alt={it.service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-gray-300">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {it.service.name}
                </div>
                <div className="text-xs text-gray-500">
                  {p ? formatVND(Number(p)) : "Liên hệ"} × {it.quantity}
                </div>
              </div>
              <span
                className={`text-[10px] uppercase font-bold rounded-full px-2 py-0.5 ${toneCls}`}
              >
                x{it.quantity}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
