import { createFileRoute } from "@tanstack/react-router";
import { FeaturedEventCard } from "@/components/FeaturedEventCard";
import { mockEvents } from "@/lib/mockPosts";

export const Route = createFileRoute("/_public/events")({
  head: () => ({
    meta: [
      { title: "Sự kiện — VITA TH Pro" },
      {
        name: "description",
        content:
          "Các sự kiện, hội thảo và workshop sắp diễn ra tại VITA TH Pro.",
      },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto max-w-[1180px] px-4 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
          Đừng bỏ lỡ
        </p>
        <h1 className="mt-1 text-3xl md:text-[34px] font-black tracking-tight text-gray-900">
          Sự kiện VITA TH Pro
        </h1>
        <p className="mt-2 text-gray-500 max-w-[620px]">
          Danh sách các sự kiện, hội thảo và workshop sắp diễn ra – đăng ký để
          nhận ưu đãi tham gia sớm.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockEvents.map((e) => (
            <FeaturedEventCard key={e.id} post={e} />
          ))}
        </div>
      </div>
    </section>
  );
}
