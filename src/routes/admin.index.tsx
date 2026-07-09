import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminTopbar } from "@/components/AdminTopbar";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

type Range = "day" | "week" | "month";

const vnd = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

/* ---------------- MOCK DATA ---------------- */
const serviceRevenueMock: Record<Range, { label: string; value: number }[]> = {
  day: [
    { label: "00h", value: 1200000 },
    { label: "04h", value: 800000 },
    { label: "08h", value: 3400000 },
    { label: "12h", value: 5200000 },
    { label: "16h", value: 6800000 },
    { label: "20h", value: 4100000 },
  ],
  week: [
    { label: "T2", value: 12000000 },
    { label: "T3", value: 15800000 },
    { label: "T4", value: 9800000 },
    { label: "T5", value: 18500000 },
    { label: "T6", value: 22400000 },
    { label: "T7", value: 27100000 },
    { label: "CN", value: 19900000 },
  ],
  month: Array.from({ length: 12 }, (_, i) => ({
    label: `T${i + 1}`,
    value: Math.round(40000000 + Math.sin(i / 2) * 18000000 + Math.random() * 8000000),
  })),
};

const productRevenueMock: Record<Range, { label: string; cash: number; transfer: number }[]> = {
  day: ["00h", "04h", "08h", "12h", "16h", "20h"].map((label, i) => ({
    label,
    cash: 500000 + i * 400000,
    transfer: 300000 + i * 600000,
  })),
  week: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label, i) => ({
    label,
    cash: 3000000 + i * 800000 + Math.random() * 1500000,
    transfer: 4500000 + i * 900000 + Math.random() * 1800000,
  })),
  month: Array.from({ length: 12 }, (_, i) => ({
    label: `T${i + 1}`,
    cash: Math.round(10000000 + Math.random() * 8000000),
    transfer: Math.round(14000000 + Math.random() * 12000000),
  })),
};

const customerCorrelationMock: Record<Range, { name: string; value: number }[]> = {
  day: [
    { name: "Khách mới", value: 12 },
    { name: "Khách cũ", value: 34 },
  ],
  week: [
    { name: "Khách mới", value: 68 },
    { name: "Khách cũ", value: 152 },
  ],
  month: [
    { name: "Khách mới", value: 284 },
    { name: "Khách cũ", value: 612 },
  ],
};

const expenseMock: Record<Range, { label: string; value: number }[]> = {
  day: ["00h", "04h", "08h", "12h", "16h", "20h"].map((label, i) => ({
    label,
    value: 300000 + i * 220000,
  })),
  week: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label, i) => ({
    label,
    value: Math.round(2000000 + Math.random() * 4000000 + i * 200000),
  })),
  month: Array.from({ length: 12 }, (_, i) => ({
    label: `T${i + 1}`,
    value: Math.round(8000000 + Math.random() * 6000000),
  })),
};

const netProfitMock = [
  { label: "T1", income: 42000000, expense: 24000000, profit: 18000000 },
  { label: "T2", income: 48000000, expense: 26000000, profit: 22000000 },
  { label: "T3", income: 55000000, expense: 30000000, profit: 25000000 },
  { label: "T4", income: 51000000, expense: 32000000, profit: 19000000 },
  { label: "T5", income: 62000000, expense: 33000000, profit: 29000000 },
  { label: "T6", income: 71000000, expense: 38000000, profit: 33000000 },
  { label: "T7", income: 68000000, expense: 36000000, profit: 32000000 },
];

const bestsellersMock = [
  { name: "Cabin AI thải độc BIG", value: 42 },
  { name: "Xông hơi dưỡng sinh", value: 36 },
  { name: "Gói liệu trình 5 buổi", value: 31 },
  { name: "Máy Terahertz chân", value: 24 },
  { name: "Giải cơ châm cứu", value: 18 },
];

const heatmapDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const heatmapHours = ["8h", "10h", "12h", "14h", "16h", "18h", "20h"];
const heatmapMock: number[][] = heatmapDays.map(() =>
  heatmapHours.map(() => Math.round(Math.random() * 10)),
);

const staffPerformanceMock = [
  { metric: "Ca làm", A: 120, B: 98, fullMark: 150 },
  { metric: "Hoa hồng", A: 98, B: 130, fullMark: 150 },
  { metric: "OT", A: 86, B: 70, fullMark: 150 },
  { metric: "Đánh giá", A: 140, B: 110, fullMark: 150 },
  { metric: "Doanh số", A: 105, B: 125, fullMark: 150 },
  { metric: "Chuyên cần", A: 130, B: 118, fullMark: 150 },
];

const treatmentFunnelMock = [
  { name: "Thẻ mới bán", value: 320, fill: "#3B82F6" },
  { name: "Đang sử dụng", value: 210, fill: "#8B5CF6" },
  { name: "Gần hết buổi", value: 120, fill: "#F59E0B" },
  { name: "Đã hết buổi", value: 68, fill: "#EF4444" },
];

const affiliateGaugeMock = [{ name: "KPI", value: 78, fill: "#10B981" }];

/* ---------------- SHARED ---------------- */
function useLoading(delay = 900) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return loading;
}

function useCountUp(target: number, duration = 1200, deps: unknown[] = []) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, ...deps]);
  return n;
}

function RangeTabs({ value, onChange }: { value: Range; onChange: (v: Range) => void }) {
  const opts: { v: Range; l: string }[] = [
    { v: "day", l: "Ngày" },
    { v: "week", l: "Tuần" },
    { v: "month", l: "Tháng" },
  ];
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            value === o.v ? "bg-white text-brand-dark shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  right,
  children,
  loading,
  height = 260,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  loading: boolean;
  height?: number;
}) {
  return (
    <div className="group bg-white border border-hairline rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-black text-brand-dark truncate">{title}</h3>
          {subtitle && <p className="text-xs text-ink-muted font-medium mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div style={{ height }} className="relative">
        {loading ? <ChartSkeleton /> : <div className="animate-fade-in h-full">{children}</div>}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-full w-full rounded-lg bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 animate-pulse flex items-end justify-around p-4 gap-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-md bg-slate-200"
          style={{ height: `${30 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  );
}

/* ---------------- CHART 1: Service Revenue Area ---------------- */
function ServiceRevenueChart() {
  const loading = useLoading(700);
  const [range, setRange] = useState<Range>("week");
  const data = serviceRevenueMock[range];
  return (
    <ChartCard
      title="Doanh thu dịch vụ"
      subtitle="Tổng doanh thu từ dịch vụ trị liệu"
      loading={loading}
      right={<RangeTabs value={range} onChange={setRange} />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradService" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
          <Tooltip
            cursor={{ stroke: "#3B82F6", strokeWidth: 1, strokeDasharray: "4 4" }}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            formatter={(v: number) => [vnd(v), "Doanh thu"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3B82F6"
            strokeWidth={2.5}
            fill="url(#gradService)"
            animationDuration={1400}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ---------------- CHART 2: Product Revenue Stacked Bar ---------------- */
function ProductRevenueChart() {
  const loading = useLoading(800);
  const [range, setRange] = useState<Range>("week");
  const data = productRevenueMock[range];
  return (
    <ChartCard
      title="Doanh thu sản phẩm"
      subtitle="Tiền mặt vs Chuyển khoản"
      loading={loading}
      right={<RangeTabs value={range} onChange={setRange} />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
          <Tooltip
            cursor={{ fill: "rgba(59,130,246,0.06)" }}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            formatter={(v: number) => vnd(v)}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          <Bar
            dataKey="cash"
            name="Tiền mặt"
            stackId="a"
            fill="#F59E0B"
            animationDuration={1200}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="transfer"
            name="Chuyển khoản"
            stackId="a"
            fill="#10B981"
            radius={[8, 8, 0, 0]}
            animationDuration={1200}
            animationBegin={200}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ---------------- CHART 3: Customer Donut ---------------- */
function CustomerCorrelationChart() {
  const loading = useLoading(650);
  const [range, setRange] = useState<Range>("week");
  const data = customerCorrelationMock[range];
  const total = data.reduce((s, d) => s + d.value, 0);
  const counter = useCountUp(total, 1100, [range]);
  const colors = ["#EF4444", "#8B5CF6"];
  return (
    <ChartCard
      title="Tương quan khách hàng"
      subtitle="Khách mới vs Khách cũ"
      loading={loading}
      right={<RangeTabs value={range} onChange={setRange} />}
    >
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Pie
              data={data}
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              animationDuration={1400}
              animationEasing="ease-out"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i]} />
              ))}
            </Pie>
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-4">
          <div className="text-2xl font-black text-brand-dark tabular-nums">{counter}</div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">Tổng khách</div>
        </div>
      </div>
    </ChartCard>
  );
}

/* ---------------- CHART 4: Expense Bar ---------------- */
function ExpenseChart() {
  const loading = useLoading(750);
  const [range, setRange] = useState<Range>("week");
  const data = expenseMock[range];
  return (
    <ChartCard
      title="Quản lý chi phí"
      subtitle="Dòng tiền chi ra"
      loading={loading}
      right={<RangeTabs value={range} onChange={setRange} />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity={1} />
              <stop offset="100%" stopColor="#EF4444" stopOpacity={0.8} />
            </linearGradient>
            <filter id="shadowExpense" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#EF4444" floodOpacity="0.25" />
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
          <Tooltip
            cursor={{ fill: "rgba(239,68,68,0.06)" }}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            formatter={(v: number) => vnd(v)}
          />
          <Bar
            dataKey="value"
            fill="url(#gradExpense)"
            radius={[8, 8, 0, 0]}
            filter="url(#shadowExpense)"
            animationDuration={1300}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ---------------- CHART 5: Net Profit Composed ---------------- */
function NetProfitChart() {
  const loading = useLoading(900);
  return (
    <ChartCard title="Lợi nhuận ròng" subtitle="Thu · Chi · Lợi nhuận" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={netProfitMock} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => vnd(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          <Bar dataKey="income" name="Thu" fill="#10B981" radius={[6, 6, 0, 0]} animationDuration={1200} />
          <Bar dataKey="expense" name="Chi" fill="#F97316" radius={[6, 6, 0, 0]} animationDuration={1200} animationBegin={150} />
          <Line
            type="monotone"
            dataKey="profit"
            name="Lợi nhuận"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ r: 5, fill: "#3B82F6", className: "animate-pulse" }}
            activeDot={{ r: 7 }}
            animationDuration={1600}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ---------------- CHART 6: Bestsellers Horizontal ---------------- */
function BestsellersChart() {
  const loading = useLoading(700);
  return (
    <ChartCard title="Top 5 bán chạy" subtitle="Sản phẩm & Dịch vụ" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={bestsellersMock} margin={{ top: 5, right: 20, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="gradBest" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={120}
            tick={{ fontSize: 11, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip cursor={{ fill: "rgba(139,92,246,0.06)" }} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Bar dataKey="value" fill="url(#gradBest)" radius={[0, 8, 8, 0]} animationDuration={1400} animationEasing="ease-out">
            <LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: 700, fill: "#334155" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ---------------- CHART 7: Booking Heatmap ---------------- */
function BookingHeatmap() {
  const loading = useLoading(650);
  const max = 10;
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);
  return (
    <ChartCard title="Mật độ đặt lịch" subtitle="Khung giờ × Thứ trong tuần" loading={loading}>
      <div className="h-full flex flex-col">
        <div className="flex gap-1 pl-8 mb-1">
          {heatmapHours.map((h) => (
            <div key={h} className="flex-1 text-center text-[10px] text-slate-400 font-semibold">
              {h}
            </div>
          ))}
        </div>
        <div className="flex-1 flex flex-col gap-1">
          {heatmapDays.map((day, di) => (
            <div key={day} className="flex items-center gap-1 flex-1">
              <div className="w-7 text-[10px] font-bold text-slate-500 text-right pr-1">{day}</div>
              {heatmapHours.map((_, hi) => {
                const val = heatmapMock[di][hi];
                const intensity = val / max;
                const delay = (di * heatmapHours.length + hi) * 25;
                return (
                  <div
                    key={hi}
                    className="flex-1 rounded transition-all duration-500 ease-out"
                    style={{
                      backgroundColor: visible
                        ? `rgba(16, 185, 129, ${0.1 + intensity * 0.85})`
                        : "rgba(226, 232, 240, 0.4)",
                      transitionDelay: `${delay}ms`,
                      minHeight: 18,
                    }}
                    title={`${day} ${heatmapHours[hi]}: ${val} lịch`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

/* ---------------- CHART 8: Staff Radar ---------------- */
function StaffRadarChart() {
  const loading = useLoading(850);
  return (
    <ChartCard title="Năng lực nhân viên" subtitle="OT · Hoa hồng · Ca làm · ..." loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={staffPerformanceMock}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#64748b" }} />
          <PolarRadiusAxis tick={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Radar
            name="Nhân viên A"
            dataKey="A"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.35}
            animationDuration={1400}
            className="animate-pulse"
          />
          <Radar
            name="Nhân viên B"
            dataKey="B"
            stroke="#F59E0B"
            fill="#F59E0B"
            fillOpacity={0.25}
            animationDuration={1400}
            animationBegin={200}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
        </RadarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ---------------- CHART 9: Treatment Funnel ---------------- */
function TreatmentFunnelChart() {
  const loading = useLoading(750);
  return (
    <ChartCard title="Phễu liệu trình" subtitle="Vòng đời thẻ trị liệu" loading={loading}>
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart>
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Funnel
            dataKey="value"
            data={treatmentFunnelMock}
            isAnimationActive
            animationDuration={1400}
            animationEasing="ease-out"
          >
            <LabelList
              position="right"
              fill="#334155"
              stroke="none"
              dataKey="name"
              style={{ fontSize: 11, fontWeight: 700 }}
            />
            <LabelList
              position="center"
              fill="#fff"
              stroke="none"
              dataKey="value"
              style={{ fontSize: 12, fontWeight: 800 }}
            />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ---------------- CHART 10: Affiliate Gauge ---------------- */
function AffiliateGaugeChart() {
  const loading = useLoading(700);
  const counter = useCountUp(affiliateGaugeMock[0].value, 1400);
  return (
    <ChartCard title="KPI Tiếp thị liên kết" subtitle="Mức độ hoàn thành mục tiêu tháng" loading={loading}>
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="65%"
            outerRadius="100%"
            data={affiliateGaugeMock}
            startAngle={220}
            endAngle={-40}
          >
            <defs>
              <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <filter id="gaugeGlow">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: "#f1f5f9" }}
              dataKey="value"
              cornerRadius={20}
              fill="url(#gaugeGrad)"
              animationDuration={1600}
              animationEasing="ease-out"
              style={{ filter: "url(#gaugeGlow)" }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-3xl font-black text-brand-dark tabular-nums">{counter}%</div>
          <div className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold mt-1">Đạt KPI</div>
        </div>
      </div>
    </ChartCard>
  );
}

/* ---------------- KPI STRIP ---------------- */
function KpiStrip() {
  const items = useMemo(
    () => [
      { label: "Doanh thu tháng", value: 428500000, format: vnd, tone: "text-brand-dark" },
      { label: "Khách hàng", value: 896, format: (n: number) => n.toString(), tone: "text-blue-600" },
      { label: "Đơn hàng", value: 214, format: (n: number) => n.toString(), tone: "text-violet-600" },
      { label: "Buổi liệu trình", value: 1342, format: (n: number) => n.toString(), tone: "text-emerald-600" },
    ],
    [],
  );
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {items.map((k) => (
        <Kpi key={k.label} {...k} />
      ))}
    </div>
  );
}
function Kpi({ label, value, format, tone }: { label: string; value: number; format: (n: number) => string; tone: string }) {
  const n = useCountUp(value, 1200);
  return (
    <div className="bg-white border border-hairline rounded-[18px] p-4 hover:shadow-md transition-shadow">
      <b className={`block text-[24px] tabular-nums ${tone}`}>{format(n)}</b>
      <span className="text-sm text-ink-muted font-bold">{label}</span>
    </div>
  );
}

/* ---------------- PAGE ---------------- */
function Dashboard() {
  return (
    <>
      <AdminTopbar title="Dashboard" subtitle="Tổng quan vận hành – Demo UI (mock data)" />

      <KpiStrip />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ServiceRevenueChart />
        <ProductRevenueChart />
        <CustomerCorrelationChart />
        <ExpenseChart />
        <NetProfitChart />
        <BestsellersChart />
        <BookingHeatmap />
        <StaffRadarChart />
        <TreatmentFunnelChart />
        <div className="md:col-span-2 xl:col-span-1">
          <AffiliateGaugeChart />
        </div>
      </div>
    </>
  );
}
