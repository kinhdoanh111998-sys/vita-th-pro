import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";

export interface CommunityPostProps {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
}

function formatCount(n: number): string {
  return n.toLocaleString("vi-VN");
}

export function CommunityPost({
  author,
  avatar,
  time,
  content,
  images,
  likes,
  comments,
}: CommunityPostProps) {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={avatar}
            alt={author}
            className="w-10 h-10 rounded-full object-cover bg-gray-100 shrink-0"
            loading="lazy"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {author}
            </p>
            <p className="text-xs text-gray-500 truncate">{time}</p>
          </div>
        </div>
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition shrink-0"
          aria-label="Tùy chọn"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
          {content}
        </p>
        {images.length > 0 && (
          <div className="mt-3 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
            {images.length === 1 ? (
              <img
                src={images[0]}
                alt="Hình ảnh bài đăng"
                className="w-full h-auto object-cover aspect-[4/3]"
                loading="lazy"
              />
            ) : (
              <div className="grid grid-cols-2 gap-1">
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`Hình ảnh ${idx + 1}`}
                    className="w-full h-full object-cover aspect-square"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100">
        <button className="flex items-center gap-1.5 text-gray-600 hover:text-rose-500 transition active:scale-95">
          <Heart className="w-4 h-4" />
          <span className="text-xs font-medium">{formatCount(likes)}</span>
        </button>
        <button className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-600 transition active:scale-95">
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs font-medium">{formatCount(comments)}</span>
        </button>
        <button className="flex items-center gap-1.5 text-gray-600 hover:text-emerald-600 transition active:scale-95">
          <Share2 className="w-4 h-4" />
          <span className="text-xs font-medium">Chia sẻ</span>
        </button>
      </div>
    </article>
  );
}
