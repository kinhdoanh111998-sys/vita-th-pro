import { createFileRoute } from "@tanstack/react-router";
import { Stethoscope, Award } from "lucide-react";

export const Route = createFileRoute("/_public/about/team")({
  component: TeamPage,
  head: () => ({
    meta: [
      { title: "Đội ngũ chuyên gia | Vita TH Pro" },
      { name: "description", content: "Đội ngũ bác sĩ da liễu, chuyên gia trị liệu và kỹ thuật viên tay nghề cao của Vita TH Pro." },
      { property: "og:title", content: "Đội ngũ chuyên gia | Vita TH Pro" },
      { property: "og:description", content: "Bác sĩ da liễu và chuyên gia trị liệu giàu kinh nghiệm tại Vita TH Pro." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const EXPERTS = [
  { name: "BS. Nguyễn Thu Hà", role: "Giám đốc chuyên môn", years: "20 năm", spec: "Da liễu thẩm mỹ, laser công nghệ cao", initials: "NH", ring: "from-rose-200 to-pink-300" },
  { name: "BS. Trần Đức Minh", role: "Bác sĩ chuyên khoa", years: "15 năm", spec: "Nội tiết da, trị nám chuyên sâu", initials: "TM", ring: "from-sky-200 to-emerald-300" },
  { name: "Th.S Phạm Lan Chi", role: "Chuyên gia trị liệu", years: "12 năm", spec: "Liệu trình chống lão hoá, Ultherapy", initials: "PC", ring: "from-amber-200 to-orange-300" },
  { name: "BS. Lê Hoàng Nam", role: "Bác sĩ tư vấn", years: "10 năm", spec: "Chăm sóc da nhạy cảm, tái tạo tổn thương", initials: "LN", ring: "from-emerald-200 to-teal-300" },
  { name: "Chuyên gia Vũ Mai", role: "Trưởng bộ phận KTV", years: "14 năm", spec: "Massage trị liệu, phục hồi cơ", initials: "VM", ring: "from-violet-200 to-fuchsia-300" },
  { name: "BS. Đặng Anh Tú", role: "Cố vấn công nghệ", years: "18 năm", spec: "Chuyển giao công nghệ, đào tạo đội ngũ", initials: "AT", ring: "from-indigo-200 to-sky-300" },
];

function TeamPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="relative bg-gradient-to-br from-brand-dark via-emerald-900 to-brand-primary text-white py-14 md:py-20 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex text-xs font-black uppercase tracking-[0.25em] bg-white/15 rounded-full px-3 py-1">
            Con người Vita
          </span>
          <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight">Đội ngũ chuyên gia</h1>
          <p className="mt-3 text-white/85 max-w-2xl mx-auto">
            Bác sĩ da liễu, chuyên gia trị liệu và kỹ thuật viên tay nghề cao — trực tiếp thăm khám, thiết kế phác đồ và đồng hành cùng bạn suốt liệu trình.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {EXPERTS.map((e) => (
            <div
              key={e.name}
              className="group rounded-2xl border border-hairline bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition"
            >
              <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${e.ring} grid place-items-center text-white text-2xl font-black shadow-inner`}>
                {e.initials}
              </div>
              <div className="mt-4 text-center">
                <div className="text-lg font-black text-brand-dark">{e.name}</div>
                <div className="text-sm font-bold text-brand-primary">{e.role}</div>
                <div className="text-xs text-brand-muted mt-1 flex items-center justify-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5" /> {e.spec}
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-[11px] uppercase tracking-widest font-bold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1">
                  <Award className="w-3 h-3" /> {e.years} kinh nghiệm
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
