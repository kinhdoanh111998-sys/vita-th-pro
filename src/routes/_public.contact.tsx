import { createFileRoute } from "@tanstack/react-router";
import { useSettings } from "@/lib/useSettings";

export const Route = createFileRoute("/_public/contact")({
  component: ContactPage,
});

function ContactPage() {
  const { data, isLoading } = useSettings();
  const brand = data?.brand ?? "Vita TH Pro";

  const items = [
    { label: "Hotline", value: data?.hotline, href: data?.hotline ? `tel:${data.hotline}` : undefined },
    { label: "Zalo", value: data?.zalo },
    { label: "Email", value: data?.email, href: data?.email ? `mailto:${data.email}` : undefined },
    { label: "Địa chỉ", value: data?.address },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-brand-dark mb-2">Liên hệ {brand}</h1>
      {data?.tagline && <p className="text-ink-muted mb-6">{data.tagline}</p>}

      <div className="bg-white border border-hairline rounded-2xl p-6 grid sm:grid-cols-2 gap-5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))
          : items.map((it) => (
              <div key={it.label}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                  {it.label}
                </div>
                {it.value ? (
                  it.href ? (
                    <a className="text-brand-dark font-bold hover:underline" href={it.href}>
                      {it.value}
                    </a>
                  ) : (
                    <div className="text-brand-dark font-bold">{it.value}</div>
                  )
                ) : (
                  <div className="text-ink-muted">—</div>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}
