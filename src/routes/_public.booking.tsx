import { createFileRoute } from "@tanstack/react-router";
import { BookingForm } from "@/components/BookingForm";

export const Route = createFileRoute("/_public/booking")({
  component: BookingPage,
});

function BookingPage() {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-[860px] px-5">
        <h1 className="text-3xl lg:text-[34px] font-black tracking-tight text-brand-dark">
          Đặt lịch trải nghiệm
        </h1>
        <p className="text-ink-muted mt-2">
          Để lại thông tin, đội ngũ Vita TH Pro sẽ liên hệ xác nhận lịch hẹn trong ít phút.
        </p>
        <div className="mt-8">
          <BookingForm />
        </div>
      </div>
    </section>
  );
}
