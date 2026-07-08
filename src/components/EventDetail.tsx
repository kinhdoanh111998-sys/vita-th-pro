import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarDays, MapPin, Users, Loader2, Video, Lock } from "lucide-react";
import {
  formatDateTime,
  isUpcoming,
  type EventMedia,
  type EventRow,
} from "@/lib/events";
import { EventCountdown } from "@/components/EventCountdown";
import { EventLightbox } from "@/components/EventLightbox";
import { useAuth } from "@/lib/AuthContext";

export function EventDetail({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
  const qc = useQueryClient();
  const { session } = useAuth(); // Bắt mạch xác thực người dùng
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
      if (!session) throw new Error("Vui lòng đăng nhập để đăng ký!");
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
      <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        Đang tải sự kiện...
      </div>
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

  // KHỐI UI: Khách chưa đăng nhập (Nút Khóa)
  const renderLock = () => (
    <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-6 shadow-sm text-center relative overflow-hidden">
      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 relative z-10">
        <Lock className="w-5 h-5 text-gray-500" />
      </div>
      <h3 className="font-heading font-bold text-lg text-gray-900 relative z-10">
        Đăng ký tham gia
      </h3>
      <p className="text-[13px] text-gray-600 mt-2 mb-5 relative z-10 leading-relaxed">
        Bạn cần đăng nhập để nhận vé sự kiện.
      </p>
      <Link
        to="/login"
        className="w-full h-11 rounded-xl bg-gray-900 text-white font-semibold hover:bg-gray-800 flex items-center justify-center transition-colors shadow-sm relative z-10"
      >
        Đăng nhập ngay
      </Link>
    </div>
  );

  // KHỐI UI: Khách đã đăng nhập (Form điền)
  const renderForm = () => (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        registerM.mutate();
      }}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-lg shadow-emerald-900/5 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
      <h3 className="font-heading font-bold text-lg text-gray-900 mt-1">
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
          onChange={(x) => setForm((p) => ({ ...p, full_name: x.target.value }))}
          className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition outline-none"
        />
        <input
          required
          placeholder="Số điện thoại"
          value={form.phone}
          onChange={(x) => setForm((p) => ({ ...p, phone: x.target.value }))}
          className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition outline-none"
        />
        <input
          type="email"
          placeholder="Email (tuỳ chọn)"
          value={form.email}
          onChange={(x) => setForm((p) => ({ ...p, email: x.target.value }))}
          className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition outline-none"
        />
        <button
          type="submit"
          disabled={registerM.isPending}
          className="w-full h-11 mt-1 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2 transition shadow-sm hover:shadow"
        >
          {registerM.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {e.is_free ? "Đăng ký miễn phí" : `Đăng ký · ${(e.price ?? 0).toLocaleString("vi-VN")}đ`}
        </button>
      </div>
    </form>
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

        {/* Title & Meta Info */}
        <div className={!up ? "mx-auto max-w-4xl text-center md:text-left" : ""}>
          <h1
            className={`mt-6 md:mt-8 font-heading font-black text-gray-900 tracking-tight ${
              compact ? "text-2xl" : "text-3xl md:text-4xl leading-tight"
            }`}
          >
            {e.title}
          </h1>
          <div className={`mt-4 flex flex-wrap gap-4 text-sm text-gray-600 ${!up ? "justify-center md:justify-start" : ""}`}>
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
                <Users className="w-4 h-4 text-emerald-600" /> Tối đa {e.max_attendees}
              </span>
            ) : null}
          </div>
        </div>

        {/* Countdown */}
        {up && (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-5 md:p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Đếm ngược khai mạc
            </p>
            <div className="mt-3">
              <EventCountdown target={e.start_at} />
            </div>
          </div>
        )}

        {/* Adaptive Layout: Đổi cấu trúc dựa theo trạng thái thời gian */}
        <div
          className={`mt-8 ${
            compact
              ? "flex flex-col gap-6"
              : up
              ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] items-start"
              : "flex flex-col gap-10" // Layout tràn viền cho sự kiện đã qua
          }`}
        >
          {/* Main Content (Rich Text) */}
          <div className="min-w-0">
            {e.content_rich ? (
              <div
                className={`prose prose-sm md:prose-base max-w-none text-gray-800 bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm ${
                  !up ? "mx-auto md:max-w-4xl" : ""
                }`}
                dangerouslySetInnerHTML={{ __html: e.content_rich }}
              />
            ) : (
              <div
                className={`rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-400 ${
                  !up ? "mx-auto md:max-w-4xl" : ""
                }`}
              >
                Nội dung chi tiết đang được cập nhật
              </div>
            )}

            {/* Gallery (Chỉ hiện khi sự kiện ĐÃ QUA) */}
            {!up && (
              <div className="mt-12 max-w-5xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="font-heading text-2xl md:text-3xl font-black text-gray-900">
                    Khoảnh khắc đáng giá
                  </h2>
                  <p className="text-sm md:text-base text-gray-500 mt-2">
                    Album ghi lại những giây phút ấn tượng của sự kiện.
                  </p>
                </div>
                {mediaQ.isLoading ? (
                  <p className="text-center text-gray-500">Đang tải album...</p>
                ) : media.length === 0 ? (
                  <div className="rounded-2xl bg-white border border-dashed border-gray-200 p-10 text-center text-gray-400">
                    Album đang được cập nhật
                  </div>
                ) : (
                  <div className="columns-2 md:columns-3 gap-3 md:gap-4 [column-fill:_balance]">
                    {media.map((m, i) => (
                      <button
                        key={m.id}
                        onClick={() => setLightbox(i)}
                        className="mb-3 md:mb-4 block w-full break-inside-avoid rounded-xl overflow-hidden border border-gray-100 bg-gray-50 hover:shadow-md transition-shadow relative group"
                      >
                        {m.media_type === "video" ? (
                          <>
                            <video src={m.media_url} className="w-full h-auto" muted />
                            <span className="absolute inset-0 grid place-items-center bg-black/20 text-white">
                              <span className="w-10 h-10 rounded-full bg-white/90 grid place-items-center shadow-sm">
                                <Video className="w-5 h-5 text-emerald-700 ml-0.5" />
                              </span>
                            </span>
                          </>
                        ) : (
                          <img
                            src={m.media_url}
                            alt="Khoảnh khắc sự kiện"
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

            {/* Bottom CTA (Chỉ hiện khi sự kiện ĐÃ QUA) */}
            {!up && (
              <div className="mt-10 max-w-3xl mx-auto bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 md:p-12 text-center border border-emerald-100 shadow-sm">
                <h3 className="font-heading text-xl md:text-2xl font-bold text-emerald-900 mb-3">
                  Sự kiện đã khép lại đầy cảm xúc
                </h3>
                <p className="text-emerald-700/80 mb-6 text-sm md:text-base max-w-md mx-auto">
                  Hãy đặt lịch trải nghiệm ngay hôm nay để không bỏ lỡ các ưu đãi đặc quyền ở sự kiện tiếp theo!
                </p>
                <Link
                  to={compact ? "/app" : "/booking"}
                  className="inline-flex h-12 px-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-transform active:scale-95 shadow-md"
                >
                  Đặt lịch tư vấn ngay
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar (Chỉ hiện form đăng ký nếu sự kiện SẮP DIỄN RA) */}
          {up && (
            <aside className={compact ? "space-y-5" : "space-y-6 lg:sticky lg:top-24 lg:self-start"}>
              {session ? renderForm() : renderLock()}
              <RelatedGroup title="Sắp diễn ra" items={relatedUpcoming} compact={compact} upcoming />
              <RelatedGroup title="Đã diễn ra" items={relatedPast} compact={compact} />
            </aside>
          )}

          {/* Related Events (Đẩy xuống đáy nếu sự kiện ĐÃ QUA để nhường chỗ cho Album) */}
          {!up && (
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full pt-8 border-t border-gray-200/60 mt-4">
              <RelatedGroup title="Sắp diễn ra" items={relatedUpcoming} compact={compact} upcoming />
              <RelatedGroup title="Đã diễn ra" items={relatedPast} compact={compact} />
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Viewer */}
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
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`w-2 h-2 rounded-full ${
            upcoming ? "bg-amber-500 animate-pulse" : "bg-gray-300"
          }`}
        />
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
          {title}
        </h4>
      </div>
      <ul className="space-y-4">
        {items.map((r) => (
          <li key={r.id}>
            <Link
              to={compact ? "/app/events/$id" : "/events/$id"}
              params={{ id: r.id }}
              className="flex gap-3.5 group items-start"
            >
              {r.cover_url ? (
                <img
                  src={r.cover_url}
                  alt=""
                  loading="lazy"
                  className="w-20 h-16 rounded-xl object-cover shrink-0 border border-gray-100 group-hover:shadow-md transition-shadow"
                />
              ) : (
                <div className="w-20 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-amber-50 shrink-0 border border-gray-100" />
              )}
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[13px] font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                  {r.title}
                </p>
                <p className="mt-1 text-[11px] font-medium text-gray-500 truncate flex items-center gap-1">
                  <CalendarDays className="w-3 h-3 text-gray-400" />
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
