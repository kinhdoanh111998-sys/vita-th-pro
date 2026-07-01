import { MapPin, Star } from "lucide-react";

export type AffiliateStore = {
  id: number;
  name: string;
  address: string;
  image: string;
  rating: string;
  distance: string;
};

export function AffiliateStoreCard({ store }: { store: AffiliateStore }) {
  return (
    <article className="shrink-0 md:shrink w-64 md:w-auto snap-start bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Cover */}
      <div className="relative aspect-[16/10] bg-gray-100">
        <img
          src={store.image}
          alt={store.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shadow">
          <Star className="w-3 h-3 fill-white" />
          {store.rating}
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <h3 className="text-sm font-heading font-bold text-gray-900 line-clamp-1">
          {store.name}
        </h3>
        <div className="flex items-start gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 line-clamp-2 leading-snug">
            {store.address}
          </p>
        </div>
        <p className="text-[11px] text-emerald-600 font-medium mt-2">
          Cách bạn {store.distance}
        </p>
      </div>
    </article>
  );
}
