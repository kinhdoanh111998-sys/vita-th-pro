import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Award, ShieldCheck, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_public/about/certifications")({
  component: CertificationsPage,
  head: () => ({
    meta: [
      { title: "Chứng nhận & Chứng chỉ | Vita TH Pro" },
      { name: "description", content: "Các chứng nhận, giấy phép và chứng chỉ chuyên môn khẳng định chất lượng dịch vụ tại Vita TH Pro." },
      { property: "og:title", content: "Chứng nhận & Chứng chỉ | Vita TH Pro" },
      { property: "og:description", content: "Giấy phép, chứng chỉ đào tạo và chuyển giao công nghệ của Vita TH Pro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const CERTS = [
  { name: "Giấy phép hoạt động khám bệnh, chữa bệnh", issuer: "Sở Y tế Hà Nội", year: "2015", color: "from-emerald-100 to-white" },
  { name: "Chứng chỉ chuyển giao công nghệ Laser Pico", issuer: "Lutronic – Hàn Quốc", year: "2019", color: "from-amber-100 to-white" },
  { name: "Chứng nhận ISO 9001:2015 Quản lý chất lượng", issuer: "Bureau Veritas", year: "2020", color: "from-sky-100 to-white" },
  { name: "Chứng chỉ Ultherapy Certified Practitioner", issuer: "Merz Aesthetics", year: "2021", color: "from-rose-100 to-white" },
  { name: "Chứng nhận đại lý phân phối HydraFacial", issuer: "HydraFacial LLC – USA", year: "2022", color: "from-violet-100 to-white" },
  { name: "Giấy chứng nhận Đơn vị đào tạo nghề thẩm mỹ", issuer: "Bộ LĐ-TB-XH", year: "2023", color: "from-indigo-100 to-white" },
  { name: "Chứng nhận An toàn thông tin ISO 27001", issuer: "BSI Group", year: "2024", color: "from-teal-100 to-white" },
  { name: "Giải thưởng Thương hiệu tin cậy ngành làm đẹp", issuer: "Vietnam Beauty Awards", year: "2025", color: "from-fuchsia-100 to-white" },
];

function CertificationsPage() {
  const [open, setOpen] = useState<(typeof CERTS)[number] | null>(null);

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="relative bg-gradient-to-br from-brand-dark via-emerald-900 to-brand-primary text-white py-14 md:py-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex text-xs font-black uppercase tracking-[0.25em] bg-white/15 rounded-full px-3 py-1">
            Uy tín & Minh chứng
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight text-white">Chứng nhận & Chứng chỉ</h1>
          <p className="mt-3 text-white/85 max-w-2xl mx-auto">
            Vita TH Pro tự hào sở hữu đầy đủ giấy phép hoạt động, chứng chỉ chuyên môn và chứng nhận chuyển giao công nghệ từ các đơn vị hàng đầu thế giới.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CERTS.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setOpen(c)}
              className={`text-left rounded-2xl border border-amber-200/60 bg-gradient-to-br ${c.color} p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition group`}
            >
              <div className="w-12 h-12 rounded-xl bg-white border border-amber-200 grid place-items-center text-amber-600 shadow-inner">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="mt-4 text-sm font-black text-brand-dark leading-snug line-clamp-3 min-h-[3.6em]">{c.name}</h3>
              <div className="mt-3 text-[11px] text-brand-muted">{c.issuer}</div>
              <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-0.5">
                <ShieldCheck className="w-3 h-3" /> {c.year}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogTitle className="text-center font-black text-brand-dark">
            {open?.name}
          </DialogTitle>
          <div className={`grid place-items-center rounded-2xl border border-amber-200 bg-gradient-to-br ${open?.color ?? "from-amber-100 to-white"} aspect-[3/4] p-8`}>
            <Award className="w-20 h-20 text-amber-500" />
            <div className="mt-4 text-center">
              <div className="text-lg font-black text-brand-dark">{open?.name}</div>
              <div className="text-sm text-brand-muted mt-1">{open?.issuer}</div>
              <div className="mt-2 text-xs font-black text-emerald-700">Cấp năm {open?.year}</div>
            </div>
          </div>
          <div className="flex justify-center pb-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(null)}>
              <X className="w-4 h-4" /> Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
