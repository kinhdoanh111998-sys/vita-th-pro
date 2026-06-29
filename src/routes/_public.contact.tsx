import { createFileRoute } from "@tanstack/react-router";
import { useSettings } from "@/lib/useSettings";
import { BookingForm } from "@/components/BookingForm";

export const Route = createFileRoute("/_public/contact")({
  component: ContactPage,
});

function ContactPage() {
  const { data, isLoading } = useSettings();
  const brand = data?.brand ?? "Vita TH Pro";

  const items = [
    { icon: "📞", label: "Hotline", value: data?.hotline, href: data?.hotline ? `tel:${data.hotline}` : undefined },
    { icon: "💬", label: "Zalo", value: data?.zalo },
    { icon: "✉️", label: "Email", value: data?.email, href: data?.email ? `mailto:${data.email}` : undefined },
    { icon: "📍", label: "Địa chỉ", value: data?.address },
  ];

  return (
    <section className="py-12">
      <div className="mx-auto max-w-[1180px] px-5">
        <h1 className="text-3xl lg:text-[34px] font-black tracking-tight text-brand-dark">
          Liên hệ {brand}
        </h1>
        {data?.tagline && <p className="text-ink-muted mt-2 max-w-[620px]">{data.tagline}</p>}

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] items-start">
          {/* Left: contact cards */}
          <div className="grid gap-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
                ))
              : items.map((it) => (
                  <div
                    key={it.label}
                    className="flex items-start gap-4 bg-white border border-hairline rounded-2xl p-5 shadow-[0_8px_24px_rgba(21,89,42,0.06)]"
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-dark text-lg">
                      {it.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                        {it.label}
                      </div>
                      {it.value ? (
                        it.href ? (
                          <a className="text-brand-dark font-bold hover:underline break-words" href={it.href}>
                            {it.value}
                          </a>
                        ) : (
                          <div className="text-brand-dark font-bold break-words">{it.value}</div>
                        )
                      ) : (
                        <div className="text-ink-muted">—</div>
                      )}
                    </div>
                  </div>
                ))}
          </div>

          {/* Right: booking form */}
          <div>
            <BookingForm />
          </div>
        </div>
      </div>
    </section>
  );
}
