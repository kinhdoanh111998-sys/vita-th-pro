import { money, type Product } from "@/lib/mockData";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group overflow-hidden rounded-[22px] bg-card border border-hairline shadow-[0_8px_24px_rgba(21,89,42,0.06)] flex flex-col">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-brand-soft to-white border-b border-hairline overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-contain p-3 bg-white transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        <span className="inline-flex self-start rounded-full bg-brand-soft text-brand-dark px-2.5 py-1 text-xs font-extrabold">
          {product.type}
        </span>
        <h3 className="text-[17px] font-bold leading-snug">{product.name}</h3>
        <p className="text-sm text-ink-muted line-clamp-3">{product.summary}</p>
        <div className="mt-auto pt-2 flex items-end justify-between">
          <div className="text-xl font-black text-brand-dark">
            {product.price > 0 ? money(product.price) : "Liên hệ"}
          </div>
          <small className="text-ink-muted text-xs">{product.source}</small>
        </div>
      </div>
    </article>
  );
}
