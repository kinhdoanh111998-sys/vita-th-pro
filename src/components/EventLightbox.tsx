import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import type { EventMedia } from "@/lib/events";

export function EventLightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: EventMedia[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % items.length);
      if (e.key === "ArrowLeft")
        onIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onIndex, onClose]);

  const cur = items[index];
  if (!cur) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20"
        aria-label="Đóng"
      >
        <X className="w-6 h-6" />
      </button>
      {items.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index - 1 + items.length) % items.length);
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20"
            aria-label="Trước"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index + 1) % items.length);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20"
            aria-label="Sau"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      <div
        className="max-w-[92vw] max-h-[86vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {cur.media_type === "video" ? (
          <video
            src={cur.media_url}
            controls
            autoPlay
            className="max-w-full max-h-[86vh] rounded-lg"
          />
        ) : (
          <img
            src={cur.media_url}
            alt=""
            className="max-w-full max-h-[86vh] object-contain rounded-lg"
          />
        )}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
        {index + 1} / {items.length}
      </div>
    </div>
  );
}
