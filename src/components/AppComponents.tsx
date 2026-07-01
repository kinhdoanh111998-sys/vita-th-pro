import { Search, Star, MapPin, Clock } from "lucide-react";
import type { ReactNode } from "react";

/* ---------- Search Bar ---------- */
export function SearchBar({
  placeholder = "Tìm kiếm...",
  value,
  onChange,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="rounded-full bg-gray-100 h-10 px-4 flex items-center gap-2">
      <Search className="w-4 h-4 text-gray-400 shrink-0" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent flex-1 outline-none text-sm placeholder:text-gray-400"
      />
    </div>
  );
}

/* ---------- Filter Tabs ---------- */
export function FilterTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (t: string) => void;
}) {
  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={
              "rounded-full px-4 py-1.5 whitespace-nowrap text-sm font-medium transition-colors " +
              (isActive
                ? "bg-brand-primary text-white"
                : "bg-gray-100 text-gray-600")
            }
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Store Card ---------- */
export type StoreCardProps = {
  image: string;
  name: string;
  rating: number;
  address: string;
  distance: string;
};

export function StoreCard({
  image,
  name,
  rating,
  address,
  distance,
}: StoreCardProps) {
  return (
    <div className="flex gap-3 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
      <img
        src={image}
        alt={name}
        className="w-24 h-24 rounded-lg object-cover shrink-0"
      />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h3 className="font-heading text-base line-clamp-1">{name}</h3>
        <div className="flex items-center gap-1 text-yellow-400 text-sm">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span className="text-gray-700 font-medium">{rating.toFixed(1)}</span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2">{address}</p>
        <span className="text-xs text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full w-fit">
          {distance}
        </span>
      </div>
    </div>
  );
}

/* ---------- Article / Event Card ---------- */
export type ArticleCardProps = {
  image: string;
  category: string;
  title: string;
  meta: string;
  metaIcon?: "time" | "location";
};

export function ArticleCard({
  image,
  category,
  title,
  meta,
  metaIcon = "time",
}: ArticleCardProps) {
  const Icon = metaIcon === "location" ? MapPin : Clock;
  return (
    <article className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm">
      <img src={image} alt={title} className="aspect-video w-full object-cover" />
      <div className="p-3">
        <div className="text-xs text-brand-primary font-medium mb-1">
          {category}
        </div>
        <h3 className="font-heading text-sm line-clamp-2 mb-2">{title}</h3>
        <div className="flex items-center text-xs text-gray-500 gap-1">
          <Icon className="w-3.5 h-3.5" />
          <span className="line-clamp-1">{meta}</span>
        </div>
      </div>
    </article>
  );
}

/* ---------- Horizontal Scroll List ---------- */
export function HorizontalScrollList({ children }: { children: ReactNode }) {
  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4 pb-4 no-scrollbar">
      {children}
    </div>
  );
}

export function HScrollItem({ children }: { children: ReactNode }) {
  return (
    <div className="snap-center shrink-0 w-[80%] md:w-[300px]">{children}</div>
  );
}

/* ---------- Section Header ---------- */
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 mt-4 mb-2">
      <h2 className="font-heading text-lg">{title}</h2>
      {action}
    </div>
  );
}
