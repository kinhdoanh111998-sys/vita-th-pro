import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, MapPin, Users, Loader2, Video } from "lucide-react";
import {
  formatDateTime,
  isUpcoming,
  type EventMedia,
  type EventRow,
} from "@/lib/events";
import { EventCountdown } from "@/components/EventCountdown";
import { EventLightbox } from "@/components/EventLightbox";

export function EventDetail({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
  const qc = useQueryClient();
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });

  const eventQ = useQuery({
    queryKey: ["public", "event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as EventRow;
    },
  });

  const mediaQ = useQuery({
    queryKey: ["public", "event_media", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_media")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EventMedia[];
    },
  });

  const relatedQ = useQuery({
    queryKey: ["public", "events", "related"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,title,cover_url,start_at,end_at,location,category,format,is_free,price,max_attendees,content_rich,created_at")
        .order("start_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as EventRow[];
    },
  });

  const registerM = useMutation({
    mutationFn: async () => {
      const full_name = form.full_name.trim();
      const phone = form.phone.trim();
      if (full_name.length < 2) throw new Error("Nhập họ tên");
      if (!/^[0-9+\s\-()]{6,20}$/.test(phone))
        throw new Error("Số điện thoại không hợp lệ");
      const { error } = await supabase.from("event_registrations").insert({
        event_id: id,
        full_name,
        phone,
        email: form.email.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đăng ký thành công! Chúng tôi sẽ liên hệ lại sớm.");
      setForm({ full_name: "", phone: "", email: "" });
      qc.invalidateQueries({ queryKey: ["admin", "event_regs", id] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (eventQ.isLoading)
    return (
      <div className="p-10 text-center text-gray-500">Đang tải sự kiện...</div>
    );
  if (eventQ.error || !eventQ.data)
    return (
      <div className="p-10 text-center text-gray-500">
        Không tìm thấy sự kiện
      </div>
    );

  const e = eventQ.data;
  const up = isUpcoming(e);
  const media = mediaQ.data ?? [];

  const related = (relatedQ.data ?? []).filter((r) => r.id !== id);
  const relatedUpcoming = related.filter(isUpcoming).slice(0, 4);
  const relatedPast = related.filter((r) => !isUpcoming(r)).slice(0, 4);

  const wrap = compact
    ? "max-w-full px-4"
    : "max-w-[1180px] mx-auto px-4 md:px-6";

  const sidebar = (
    <aside className={compact ? "space-y-5" : "space-y-5 lg:sticky lg:top-24 lg:self-start"}>
      {up ? (
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            registerM.mutate();
          }}
          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <h3 className="font-heading font-bold text-lg text-gray-900">
            Đăng ký tham gia
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Điền thông tin để nhận vé mời & lịch chi tiết.
          </p>
          <div className="mt-4 space-y-3">
            <input
              required
              placeholder="Họ và tên"
              value={form.full_name}
              onChange={(x) =>
                setForm((p) => ({ ...p, full_name: x.target.value }))
              }
              className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm focus:outline-emerald-500"
            />
            <input
              required
              placeholder="Số điện thoại"
              value={form.phone}
              onChange={(x) =>
                setForm((p) => ({ ...p, phone: x.target.value }))
              }
              className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm focus:outline-emerald-500"
            />
            <input
              type="email"
              placeholder="Email (tuỳ chọn)"
              value={form.email}
              onChange={(x) =>
                setForm((p) => ({ ...p, email: x.target.value }))
              }
              className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm focus:outline-emerald-500"
            />
            <button
              type="submit"
              disabled={registerM.isPending}
              className="w-full h-11 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {registerM.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {e.is_free
                ? "Đăng ký miễn phí"
                : `Đăng ký · ${(e.price ?? 0).toLocaleString("vi-VN")}đ`}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="font-heading font-bold text-lg text-gray-900">
            Sự kiện đã khép lại
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Đặt lịch trải nghiệm để không bỏ lỡ các sự kiện tiếp theo.
          </p>
          <Link
            to={compact ? "/app" : "/booking"}
            className="mt-4 block text-center h-11 leading-[44px] rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
          >
            Đặt lịch tư vấn
          </Link>
        </div>
      )}

      <RelatedGroup
        title="Sắp diễn ra"
        items={relatedUpcoming}
        compact={compact}
        upcoming
      />
      <RelatedGroup
        title="Đã diễn ra"
        items={relatedPast}
        compact={compact}
      />
    </aside>
  );

  const mainContent = (
    <div className="space-y-8">
      {e.content_rich ? (
        <div
          className="prose prose-sm md:prose-base max-w-none text-gray-700 bg-white rounded-2xl border border-gray-100 p-5 md:p-7 shadow-sm"
          dangerouslySetInnerHTML={{ __html: e.content_rich }}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-400">
          Nội dung chi tiết đang được cập nhật
        </div>
      )}

      {!up && (
        <div>
          <h2 className="font-heading text-xl md:text-2xl font-black text-gray-900">
            Khoảnh khắc đáng giá
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Album ghi lại những giây phút ấn tượng của sự kiện.
          </p>
          {mediaQ.isLoading ? (
            <p className="mt-6 text-gray-500">Đang tải album...</p>
          ) : media.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-white border border-dashed border-gray-200 p-10 text-center text-gray-400">
              Album đang được cập nhật
            </div>
          ) : (
            <div className="mt-6 columns-2 md:columns-3 gap-3 [column-fill:_balance]">
              {media.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setLightbox(i)}
                  className="mb-3 block w-full break-inside-avoid rounded-xl overflow-hidden border border-gray-100 bg-gray-50 hover:shadow-md transition-shadow relative group"
                >
                  {m.media_type === "video" ? (
                    <>
                      <video
                        src={m.media_url}
                        className="w-full h-auto"
                        muted
                      />
                      <span className="absolute inset-0 grid place-items-center bg-black/20 text-white">
                        <span className="w-10 h-10 rounded-full bg-white/90 grid place-items-center">
                          <Video className="w-5 h-5 text-emerald-700" />
                        </span>
                      </span>
                    </>
                  ) : (
                    <img
                      src={m.media_url}
                      alt=""
                      loading="lazy"
                      className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section className={`py-6 ${compact ? "" : "md:py-12"} bg-[#fafaf7] min-h-screen`}>
      <div className={wrap}>
        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white">
          {e.cover_url ? (
            <img
              src={e.cover_url}
              alt={e.title}
              className={`w-full ${compact ? "aspect-[16/10]" : "aspect-[16/7]"} object-cover`}
            />
          ) : (
            <div className={`w-full ${compact ? "aspect-[16/10]" : "aspect-[16/7]"} bg-gradient-to-br from-emerald-100 to-amber-50`} />
          )}
          <div className="absolute top-4 left-4 flex gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shadow ${
                up ? "bg-amber-500 text-white" : "bg-gray-800 text-white"
              }`}
            >
              {up ? "Sắp tổ chức" : "Đã diễn ra"}
            </span>
            {e.category && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-emerald-700 shadow">
                {e.category}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h1
          className={`mt-6 font-heading font-black text-gray-900 tracking-tight ${
            compact ? "text-2xl" : "text-3xl md:text-[38px]"
          }`}
        >
          {e.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-emerald-600" />
            {formatDateTime(e.start_at)} — {formatDateTime(e.end_at)}
          </span>
          {e.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" /> {e.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Video className="w-4 h-4 text-emerald-600" />
            {e.format === "online" ? "Online" : "Offline"}
          </span>
          {e.max_attendees ? (
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" /> Tối đa{" "}
              {e.max_attendees}
            </span>
          ) : null}
        </div>

        {up && (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Đếm ngược khai mạc
            </p>
            <div className="mt-3">
              <EventCountdown target={e.start_at} />
            </div>
          </div>
        )}

        {/* Body: main + sticky sidebar */}
        <div
          className={`mt-8 grid gap-6 ${
            compact ? "" : "lg:grid-cols-[minmax(0,1fr)_360px]"
          }`}
        >
          {mainContent}
          {sidebar}
        </div>
      </div>
      {lightbox !== null && (
        <EventLightbox
          items={media}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndex={setLightbox}
        />
      )}
    </section>
  );
}

function RelatedGroup({
  title,
  items,
  compact,
  upcoming = false,
}: {
  title: string;
  items: EventRow[];
  compact: boolean;
  upcoming?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            upcoming ? "bg-amber-500" : "bg-gray-400"
          }`}
        />
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
          {title}
        </h4>
      </div>
      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.id}>
            <Link
              to={compact ? "/app/events/$id" : "/events/$id"}
              params={{ id: r.id }}
              className="flex gap-3 group"
            >
              {r.cover_url ? (
                <img
                  src={r.cover_url}
                  alt=""
                  loading="lazy"
                  className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-100"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-emerald-100 to-amber-50 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                  {r.title}
                </p>
                <p className="mt-1 text-[11px] text-gray-500 truncate">
                  {formatDateTime(r.start_at)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
