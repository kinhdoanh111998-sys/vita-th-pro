import { CalendarDays, MapPin } from "lucide-react";
import type { MockPost } from "@/lib/mockPosts";

export function FeaturedEventCard({ post }: { post: MockPost }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={post.image}
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500 text-white shadow-md">
          Sắp diễn ra
        </span>
      </div>
      <div className="p-4 md:p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-heading font-bold text-[16px] md:text-[17px] text-gray-900 leading-snug line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2">{post.summary}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-700">
          <CalendarDays className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{post.eventDate}</span>
        </div>
        {post.location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">{post.location}</span>
          </div>
        )}
        <button
          type="button"
          className="mt-3 inline-flex items-center justify-center h-10 rounded-xl text-white text-sm font-semibold transition-colors"
          style={{ backgroundColor: "#1B9606" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#147805")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#1B9606")
          }
        >
          Đăng ký tham gia
        </button>
      </div>
    </article>
  );
}
