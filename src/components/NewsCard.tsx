import { ArrowRight } from "lucide-react";
import type { MockPost } from "@/lib/mockPosts";

export function NewsCard({ post }: { post: MockPost }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        <img
          src={post.image}
          alt={post.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-4 md:p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-heading font-bold text-[15px] md:text-[17px] text-gray-900 leading-snug line-clamp-2">
          {post.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2">{post.summary}</p>
        <div className="mt-auto pt-3 flex items-center justify-between text-xs">
          <span className="text-gray-400">{post.date}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 group-hover:gap-1.5 transition-all">
            Đọc thêm <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
