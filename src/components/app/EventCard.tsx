import { Clock, MapPin } from "lucide-react";

export type EventStatus = "Sắp tổ chức" | "Đang diễn ra" | "Đã diễn ra";

export interface EventCardProps {
  title: string;
  status: EventStatus;
  date: string;
  location: string;
  image: string;
}

const STATUS_STYLES: Record<EventStatus, string> = {
  "Sắp tổ chức": "bg-amber-500 text-white",
  "Đang diễn ra": "bg-emerald-500 text-white",
  "Đã diễn ra": "bg-gray-500 text-white",
};

export function EventCard({ title, status, date, location, image }: EventCardProps) {
  return (
    <article className="shrink-0 w-64 snap-start rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100">
      <div className="relative aspect-[16/9] bg-gray-100">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
        <span
          className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-semibold shadow ${STATUS_STYLES[status]}`}
        >
          {status}
        </span>
      </div>
      <div className="p-3 space-y-1.5">
        <h3 className="text-sm font-heading font-bold text-gray-900 line-clamp-2 leading-snug">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{location}</span>
        </div>
      </div>
    </article>
  );
}
