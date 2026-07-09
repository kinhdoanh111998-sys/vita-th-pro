import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Plus } from "lucide-react";
import { AdminTopbar } from "@/components/AdminTopbar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

type Range = "day" | "week" | "month";

const vnd = (n: number) =>
  (n || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

/* ---------------- Helpers ---------------- */
function rangeBounds(range: Range) {
  const now = new Date();
  const from = new Date(now);
  if (range === "day") from.setHours(0, 0, 0, 0);
  else if (range === "week") {
    from.setDate(now.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else {
    from.setDate(now.getDate() - 29);
    from.setHours(0, 0, 0, 0);
  }
  return { from, to: now };
}

function bucketKey(d: Date, range: Range) {
  if (range === "day") return `${d.getHours()}h`;
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  if (range === "week") return days[d.getDay()];
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function buildBuckets(range: Range): string[] {
  const now = new Date();
  if (range === "day")
    return ["0h", "4h", "8h", "12h", "16h", "20h"].map((s) => s);
  if (range === "week") {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const arr: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      arr.push(days[d.getDay()]);
    }
    return arr;
  }
  const arr: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    arr.push(`${d.getDate()}/${d.getMonth() + 1}`);
  }
  return arr;
}

function dayBucketFromHour(h: number) {
  if (h < 4) return "0h";
  if (h < 8) return "4h";
  if (h < 12) return "8h";
  if (h < 16) return "12h";
  if (h < 20) return "16h";
  return "20h";
}

/* ---------------- Shared UI ---------------- */
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
    <div className="bg-white border border-hairline rounded-2xl p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow duration-300">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-black text-brand-dark truncate">{title}</h3>
          {subtitle && (
            <p className="text-xs text-ink-muted font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
      <div style={{ height }} className="relative">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <div className="animate-fade-in h-full">{children}</div>
        )}
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
          style={{ height: `${30 + ((i * 37) % 60)}%` }}
        />
      ))}
    </div>
  );
}

function RangeTabs({
  value,
  onChange,
}: {
  value: Range;
  onChange: (v: Range) => void;
}) {
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
            value === o.v
              ? "bg-white text-brand-dark shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Revenue Query (shared) ---------------- */
type OrderRow = {
  id: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
};
type OrderItemRow = {
  order_id: string;
  item_type: "product" | "service";
  total_price: number;
};

function useRevenueData(range: Range) {
  return useQuery({
    queryKey: ["dashboard", "revenue", range],
    queryFn: async () => {
      const { from, to } = rangeBounds(range);
      const { data: orders, error: e1 } = await supabase
        .from("orders")
        .select("id,total_amount,payment_method,payment_status,status,created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .eq("payment_status", "paid");
      if (e1) throw e1;
      const ids = (orders ?? []).map((o) => o.id);
      let items: OrderItemRow[] = [];
      if (ids.length) {
        const { data: it, error: e2 } = await supabase
          .from("order_items")
          .select("order_id,item_type,total_price")
          .in("order_id", ids);
        if (e2) throw e2;
        items = (it ?? []) as OrderItemRow[];
      }
      return { orders: (orders ?? []) as OrderRow[], items };
    },
    staleTime: 30_000,
  });
}

function aggregateRevenue(
  orders: OrderRow[],
  items: OrderItemRow[],
  range: Range,
  kind: "service" | "product",
) {
  const buckets = buildBuckets(range);
  const map = new Map<string, { cash: number; transfer: number }>();
  buckets.forEach((b) => map.set(b, { cash: 0, transfer: 0 }));

  // Sum item totals per order per kind
  const perOrder = new Map<string, number>();
  items.forEach((it) => {
    if (it.item_type !== kind) return;
    perOrder.set(
      it.order_id,
      (perOrder.get(it.order_id) || 0) + Number(it.total_price || 0),
    );
  });

  orders.forEach((o) => {
    const amt = perOrder.get(o.id);
    if (!amt) return;
    const d = new Date(o.created_at);
    const key =
      range === "day"
        ? dayBucketFromHour(d.getHours())
        : bucketKey(d, range);
    const b = map.get(key);
    if (!b) return;
    if (o.payment_method === "transfer") b.transfer += amt;
    else b.cash += amt;
  });

  return buckets.map((label) => ({
    label,
    cash: Math.round(map.get(label)!.cash),
    transfer: Math.round(map.get(label)!.transfer),
  }));
}

/* ---------------- Chart: Service Revenue ---------------- */
function ServiceRevenueChart() {
  const [range, setRange] = useState<Range>("week");
  const q = useRevenueData(range);
  const data = useMemo(
    () =>
      aggregateRevenue(q.data?.orders ?? [], q.data?.items ?? [], range, "service"),
    [q.data, range],
  );
  return (
    <ChartCard
      title="Doanh thu dịch vụ"
      subtitle="Tiền mặt vs Chuyển khoản"
      loading={q.isLoading}
      right={<RangeTabs value={range} onChange={setRange} />}
    >
      <StackedRevenueChart data={data} />
    </ChartCard>
  );
}

/* ---------------- Chart: Product Revenue ---------------- */
function ProductRevenueChart() {
  const [range, setRange] = useState<Range>("week");
  const q = useRevenueData(range);
  const data = useMemo(
    () =>
      aggregateRevenue(q.data?.orders ?? [], q.data?.items ?? [], range, "product"),
    [q.data, range],
  );
  return (
    <ChartCard
      title="Doanh thu sản phẩm"
      subtitle="Tiền mặt vs Chuyển khoản"
      loading={q.isLoading}
      right={<RangeTabs value={range} onChange={setRange} />}
    >
      <StackedRevenueChart data={data} />
    </ChartCard>
  );
}

function StackedRevenueChart({
  data,
}: {
  data: { label: string; cash: number; transfer: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
        />
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
          animationDuration={900}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="transfer"
          name="Chuyển khoản"
          stackId="a"
          fill="#10B981"
          radius={[8, 8, 0, 0]}
          animationDuration={900}
          animationBegin={150}
          animationEasing="ease-out"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------------- Chart: Booking Status Donut ---------------- */
const BOOKING_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  confirmed: "#3B82F6",
  completed: "#10B981",
  cancelled: "#EF4444",
};
const BOOKING_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
};

function normalizeBookingStatus(s: string) {
  const v = (s || "").trim().toLowerCase();
  if (v.includes("chờ") || v === "pending") return "pending";
  if (v.includes("xác nhận") || v === "confirmed") return "confirmed";
  if (v.includes("hoàn thành") || v === "completed") return "completed";
  if (v.includes("hủy") || v.includes("huỷ") || v === "cancelled") return "cancelled";
  return "pending";
}

function BookingStatusChart() {
  const [range, setRange] = useState<Range>("week");
  const q = useQuery({
    queryKey: ["dashboard", "bookings", range],
    queryFn: async () => {
      const { from, to } = rangeBounds(range);
      const { data, error } = await supabase
        .from("bookings")
        .select("status,created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });
  const data = useMemo(() => {
    const counts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };
    (q.data ?? []).forEach((r: { status: string }) => {
      counts[normalizeBookingStatus(r.status)]++;
    });
    return Object.keys(counts).map((k) => ({
      key: k,
      name: BOOKING_LABELS[k],
      value: counts[k],
    }));
  }, [q.data]);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <ChartCard
      title="Trạng thái lịch hẹn"
      subtitle="Phân bố theo trạng thái"
      loading={q.isLoading}
      right={<RangeTabs value={range} onChange={setRange} />}
    >
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            />
            <Pie
              data={data}
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              animationDuration={900}
              animationEasing="ease-out"
            >
              {data.map((d) => (
                <Cell key={d.key} fill={BOOKING_COLORS[d.key]} />
              ))}
            </Pie>
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-4">
          <div className="text-2xl font-black text-brand-dark tabular-nums">
            {total}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">
            Tổng lịch
          </div>
        </div>
      </div>
    </ChartCard>
  );
}

/* ---------------- Card: Low Stock Alert ---------------- */
function LowStockCard() {
  const q = useQuery({
    queryKey: ["dashboard", "low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id,name,stock_quantity")
        .eq("type", "product")
        .eq("is_hidden", false)
        .order("stock_quantity", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
  const rows = q.data ?? [];
  const max = Math.max(1, ...rows.map((r) => Number(r?.stock_quantity ?? 0)), 10);

  return (
    <ChartCard title="Cảnh báo tồn kho" subtitle="Top 5 sắp hết" loading={q.isLoading}>
      <div className="h-full overflow-auto pr-1 space-y-3">
        {rows.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-ink-muted">
            Chưa có sản phẩm
          </div>
        ) : (
          rows.map((r) => {
            const qty = Number(r?.stock_quantity ?? 0);
            const pct = Math.max(4, Math.min(100, ((max - qty) / max) * 100));
            const critical = qty <= 3;
            return (
              <div key={r.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-brand-dark truncate pr-2">
                    {r?.name ?? "—"}
                  </span>
                  <span
                    className={`font-black tabular-nums ${critical ? "text-red-600" : "text-slate-600"}`}
                  >
                    {qty}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      critical ? "bg-red-500" : "bg-amber-400"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </ChartCard>
  );
}

/* ---------------- Chart: Expense + Add Modal ---------------- */
type ExpenseRow = {
  id: string;
  amount: number;
  category: string;
  expense_date: string;
  note: string | null;
};

function ExpenseChart() {
  const [range, setRange] = useState<Range>("week");
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["dashboard", "expenses", range],
    queryFn: async () => {
      const { from, to } = rangeBounds(range);
      const { data, error } = await supabase
        .from("expenses")
        .select("id,amount,category,expense_date,note")
        .gte("expense_date", from.toISOString().slice(0, 10))
        .lte("expense_date", to.toISOString().slice(0, 10));
      if (error) throw error;
      return (data ?? []) as ExpenseRow[];
    },
    staleTime: 30_000,
  });

  const data = useMemo(() => {
    const buckets = buildBuckets(range);
    const map = new Map<string, number>();
    buckets.forEach((b) => map.set(b, 0));
    (q.data ?? []).forEach((e) => {
      const d = new Date(e.expense_date + "T00:00:00");
      const key =
        range === "day" ? dayBucketFromHour(0) : bucketKey(d, range);
      if (map.has(key)) map.set(key, (map.get(key) || 0) + Number(e.amount));
    });
    return buckets.map((label) => ({ label, value: Math.round(map.get(label) || 0) }));
  }, [q.data, range]);

  return (
    <>
      <ChartCard
        title="Quản lý chi phí"
        subtitle="Dòng tiền chi ra"
        loading={q.isLoading}
        right={
          <>
            <RangeTabs value={range} onChange={setRange} />
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm
            </button>
          </>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F97316" stopOpacity={1} />
                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.85} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`}
            />
            <Tooltip
              cursor={{ fill: "rgba(239,68,68,0.06)" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
              formatter={(v: number) => vnd(v)}
            />
            <Bar
              dataKey="value"
              fill="url(#gradExpense)"
              radius={[8, 8, 0, 0]}
              animationDuration={900}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
      <AddExpenseDialog
        open={open}
        onOpenChange={setOpen}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["dashboard", "expenses"] });
        }}
      />
    </>
  );
}

function AddExpenseDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Vận hành");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const m = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("expenses").insert({
        amount: Number(amount),
        category,
        expense_date: date,
        note: note || null,
        created_by: u?.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setAmount("");
      setNote("");
      setErr(null);
      onOpenChange(false);
      onSaved();
    },
    onError: (e: Error) => setErr(e.message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErr("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    m.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm khoản chi</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Số tiền (VND)</Label>
            <Input
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Danh mục chi</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {[
                "Vận hành",
                "Nhân sự",
                "Marketing",
                "Nhập hàng",
                "Điện nước",
                "Khác",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Ngày chi</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nội dung khoản chi..."
              rows={3}
            />
          </div>
          {err && (
            <div className="text-xs text-red-600 bg-red-50 rounded p-2">{err}</div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Chart: Customer New vs Returning ---------------- */
function CustomerMixChart() {
  const [range, setRange] = useState<Range>("week");
  const q = useQuery({
    queryKey: ["dashboard", "customer-mix", range],
    queryFn: async () => {
      const { from, to } = rangeBounds(range);
      const [newC, ordC] = await Promise.all([
        supabase
          .from("customers")
          .select("id,created_at")
          .gte("created_at", from.toISOString())
          .lte("created_at", to.toISOString()),
        supabase
          .from("orders")
          .select("customer_id,created_at,customers!inner(created_at)")
          .gte("created_at", from.toISOString())
          .lte("created_at", to.toISOString()),
      ]);
      if (newC.error) throw newC.error;
      if (ordC.error) throw ordC.error;
      const newIds = new Set((newC.data ?? []).map((r) => r.id));
      const returningIds = new Set<string>();
      (ordC.data ?? []).forEach((o: any) => {
        const cid = o?.customer_id;
        const cCreated = o?.customers?.created_at;
        if (!cid || newIds.has(cid)) return;
        if (cCreated && new Date(cCreated) < from) returningIds.add(cid);
      });
      return { newCount: newIds.size, returningCount: returningIds.size };
    },
    staleTime: 30_000,
  });
  const data = [
    { key: "new", name: "Khách mới", value: q.data?.newCount ?? 0 },
    { key: "returning", name: "Khách cũ", value: q.data?.returningCount ?? 0 },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <ChartCard
      title="Tương quan khách hàng"
      subtitle="Khách mới vs khách cũ"
      loading={q.isLoading}
      right={<RangeTabs value={range} onChange={setRange} />}
    >
      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Pie
              data={total === 0 ? [{ key: "empty", name: "—", value: 1 }] : data}
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={3}
              dataKey="value"
              stroke="none"
              animationDuration={900}
              animationEasing="ease-out"
            >
              <Cell fill={total === 0 ? "#e2e8f0" : "#F97316"} />
              <Cell fill="#8B5CF6" />
            </Pie>
            {total > 0 && <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -mt-4">
          <div className="text-2xl font-black text-brand-dark tabular-nums">{total}</div>
          <div className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">Tổng khách</div>
        </div>
      </div>
    </ChartCard>
  );
}

/* ---------------- Chart: Net Profit (Revenue vs Expense) ---------------- */
function NetProfitChart() {
  const [range, setRange] = useState<Range>("week");
  const q = useQuery({
    queryKey: ["dashboard", "net-profit", range],
    queryFn: async () => {
      const { from, to } = rangeBounds(range);
      const [ord, exp] = await Promise.all([
        supabase
          .from("orders")
          .select("total_amount,created_at")
          .eq("payment_status", "paid")
          .gte("created_at", from.toISOString())
          .lte("created_at", to.toISOString()),
        supabase
          .from("expenses")
          .select("amount,expense_date")
          .gte("expense_date", from.toISOString().slice(0, 10))
          .lte("expense_date", to.toISOString().slice(0, 10)),
      ]);
      if (ord.error) throw ord.error;
      if (exp.error) throw exp.error;
      return { orders: ord.data ?? [], expenses: exp.data ?? [] };
    },
    staleTime: 30_000,
  });

  const data = useMemo(() => {
    const buckets = buildBuckets(range);
    const rev = new Map<string, number>();
    const cost = new Map<string, number>();
    buckets.forEach((b) => { rev.set(b, 0); cost.set(b, 0); });
    (q.data?.orders ?? []).forEach((o: any) => {
      const d = new Date(o.created_at);
      const key = range === "day" ? dayBucketFromHour(d.getHours()) : bucketKey(d, range);
      if (rev.has(key)) rev.set(key, (rev.get(key) || 0) + Number(o.total_amount || 0));
    });
    (q.data?.expenses ?? []).forEach((e: any) => {
      const d = new Date(e.expense_date + "T00:00:00");
      const key = range === "day" ? dayBucketFromHour(0) : bucketKey(d, range);
      if (cost.has(key)) cost.set(key, (cost.get(key) || 0) + Number(e.amount || 0));
    });
    return buckets.map((l) => {
      const r = Math.round(rev.get(l) || 0);
      const c = Math.round(cost.get(l) || 0);
      return { label: l, revenue: r, expense: c, profit: r - c };
    });
  }, [q.data, range]);

  return (
    <ChartCard
      title="Lợi nhuận ròng"
      subtitle="Thu · Chi · Lợi nhuận"
      loading={q.isLoading}
      right={<RangeTabs value={range} onChange={setRange} />}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1e6).toFixed(0)}M`} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} formatter={(v: number) => vnd(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
          <Bar dataKey="revenue" name="Doanh thu" fill="#10B981" radius={[6, 6, 0, 0]} animationDuration={900} animationEasing="ease-out" />
          <Bar dataKey="expense" name="Chi phí" fill="#EF4444" radius={[6, 6, 0, 0]} animationDuration={900} animationBegin={150} animationEasing="ease-out" />
          <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={1200} animationEasing="ease-out" />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

/* ---------------- Chart: Top 5 Bestsellers ---------------- */
function TopBestsellersChart() {
  const [range, setRange] = useState<Range>("month");
  const q = useQuery({
    queryKey: ["dashboard", "top5", range],
    queryFn: async () => {
      const { from, to } = rangeBounds(range);
      const { data: orders, error: e1 } = await supabase
        .from("orders")
        .select("id")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString());
      if (e1) throw e1;
      const ids = (orders ?? []).map((o) => o.id);
      if (!ids.length) return [];
      const { data: items, error: e2 } = await supabase
        .from("order_items")
        .select("item_id,quantity")
        .in("order_id", ids);
      if (e2) throw e2;
      const map = new Map<string, number>();
      (items ?? []).forEach((it: any) => {
        map.set(it.item_id, (map.get(it.item_id) || 0) + Number(it.quantity || 0));
      });
      const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
      const topIds = top.map((t) => t[0]);
      if (!topIds.length) return [];
      const { data: svcs, error: e3 } = await supabase
        .from("services")
        .select("id,name")
        .in("id", topIds);
      if (e3) throw e3;
      const nameMap = new Map((svcs ?? []).map((s: any) => [s.id, s.name]));
      return top.map(([id, qty]) => ({ name: nameMap.get(id) ?? "—", qty }));
    },
    staleTime: 60_000,
  });
  const rows = q.data ?? [];
  return (
    <ChartCard
      title="Top 5 bán chạy"
      subtitle="Sản phẩm & dịch vụ"
      loading={q.isLoading}
      right={<RangeTabs value={range} onChange={setRange} />}
    >
      {rows.length === 0 ? (
        <div className="h-full flex items-center justify-center text-xs text-ink-muted">Chưa có đơn hàng trong kỳ</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 20, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#475569" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Bar dataKey="qty" name="Số lượng" fill="#6366F1" radius={[0, 8, 8, 0]} animationDuration={900} animationEasing="ease-out">
              <LabelList dataKey="qty" position="right" style={{ fontSize: 11, fill: "#334155", fontWeight: 700 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* ---------------- Chart: Treatment Funnel ---------------- */
function TreatmentFunnelChart() {
  const q = useQuery({
    queryKey: ["dashboard", "treatment-funnel"],
    queryFn: async () => {
      const { data, error } = await supabase.from("treatments").select("status");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
  const data = useMemo(() => {
    const rows = q.data ?? [];
    const sold = rows.length;
    const completed = rows.filter((r: any) => r.status === "completed" || r.status === "done").length;
    const inUse = rows.filter((r: any) => r.status !== "pending" && r.status !== "completed" && r.status !== "done").length;
    return [
      { name: "Đã bán", value: sold, fill: "#3B82F6" },
      { name: "Đang sử dụng", value: inUse + completed, fill: "#8B5CF6" },
      { name: "Hoàn thành", value: completed, fill: "#10B981" },
    ];
  }, [q.data]);
  const empty = data.every((d) => d.value === 0);
  return (
    <ChartCard title="Phễu liệu trình" subtitle="Tiến độ sử dụng" loading={q.isLoading}>
      {empty ? (
        <div className="h-full flex items-center justify-center text-xs text-ink-muted">Chưa có liệu trình</div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Funnel dataKey="value" data={data} isAnimationActive animationDuration={900} animationEasing="ease-out">
              <LabelList position="right" fill="#334155" stroke="none" dataKey="name" style={{ fontSize: 11, fontWeight: 700 }} />
              <LabelList position="center" fill="#fff" stroke="none" dataKey="value" style={{ fontSize: 13, fontWeight: 800 }} />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* ---------------- Chart: Booking Heatmap ---------------- */
function BookingHeatmapCard() {
  const q = useQuery({
    queryKey: ["dashboard", "booking-heatmap"],
    queryFn: async () => {
      const from = new Date();
      from.setDate(from.getDate() - 60);
      const { data, error } = await supabase
        .from("bookings")
        .select("booking_date,booking_time,created_at")
        .gte("created_at", from.toISOString());
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
  const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  const slots = ["Sáng", "Chiều", "Tối"];
  const grid = useMemo(() => {
    const m = new Map<string, number>();
    days.forEach((d) => slots.forEach((s) => m.set(`${d}|${s}`, 0)));
    (q.data ?? []).forEach((b: any) => {
      const ds = b?.booking_date || b?.created_at;
      if (!ds) return;
      const dt = new Date(ds);
      const dow = (dt.getDay() + 6) % 7; // Mon=0
      const timeStr = String(b?.booking_time || "");
      const hh = Number(timeStr.split(":")[0] || dt.getHours());
      const slot = hh < 12 ? "Sáng" : hh < 18 ? "Chiều" : "Tối";
      const key = `${days[dow]}|${slot}`;
      m.set(key, (m.get(key) || 0) + 1);
    });
    return m;
  }, [q.data]);
  const max = Math.max(1, ...Array.from(grid.values()));
  const empty = Array.from(grid.values()).every((v) => v === 0);

  return (
    <ChartCard title="Bản đồ nhiệt lịch hẹn" subtitle="60 ngày gần nhất" loading={q.isLoading}>
      {empty ? (
        <div className="h-full flex items-center justify-center text-xs text-ink-muted">Chưa có lịch hẹn</div>
      ) : (
        <div className="h-full flex flex-col gap-2">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-1.5 text-[10px] font-bold text-slate-500 uppercase">
            <div />
            {days.map((d) => (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>
          {slots.map((s) => (
            <div key={s} className="grid grid-cols-[60px_repeat(7,1fr)] gap-1.5 flex-1">
              <div className="text-xs font-bold text-slate-600 flex items-center">{s}</div>
              {days.map((d) => {
                const v = grid.get(`${d}|${s}`) || 0;
                const intensity = v / max;
                const bg = v === 0
                  ? "#f1f5f9"
                  : `rgba(59,130,246,${0.15 + intensity * 0.75})`;
                return (
                  <div
                    key={d + s}
                    title={`${d} ${s}: ${v} lịch`}
                    className="rounded-md flex items-center justify-center text-[11px] font-bold text-white transition-all duration-500 ease-out hover:scale-105"
                    style={{ background: bg, color: intensity > 0.4 ? "#fff" : "#334155" }}
                  >
                    {v > 0 ? v : ""}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

/* ---------------- KPI Strip ---------------- */
function useCountUp(target: number, duration = 900) {
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
  }, [target, duration]);
  return n;
}

function KpiStrip() {
  const q = useQuery({
    queryKey: ["dashboard", "kpis"],
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [rev, cust, ord, book] = await Promise.all([
        supabase
          .from("orders")
          .select("total_amount")
          .eq("payment_status", "paid")
          .gte("created_at", monthStart.toISOString()),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString()),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString()),
      ]);
      const revenue = (rev.data ?? []).reduce(
        (s, r: { total_amount: number }) => s + Number(r.total_amount || 0),
        0,
      );
      return {
        revenue,
        customers: cust.count ?? 0,
        orders: ord.count ?? 0,
        bookings: book.count ?? 0,
      };
    },
    staleTime: 60_000,
  });
  const d = q.data;
  const items = [
    {
      label: "Doanh thu tháng",
      value: d?.revenue ?? 0,
      format: vnd,
      tone: "text-brand-dark",
    },
    {
      label: "Khách hàng",
      value: d?.customers ?? 0,
      format: (n: number) => n.toString(),
      tone: "text-blue-600",
    },
    {
      label: "Đơn tháng này",
      value: d?.orders ?? 0,
      format: (n: number) => n.toString(),
      tone: "text-violet-600",
    },
    {
      label: "Lịch hẹn tháng",
      value: d?.bookings ?? 0,
      format: (n: number) => n.toString(),
      tone: "text-emerald-600",
    },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {items.map((k) => (
        <Kpi key={k.label} {...k} loading={q.isLoading} />
      ))}
    </div>
  );
}

function Kpi({
  label,
  value,
  format,
  tone,
  loading,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  tone: string;
  loading: boolean;
}) {
  const n = useCountUp(value, 900);
  return (
    <div className="bg-white border border-hairline rounded-[18px] p-4 hover:shadow-md transition-shadow">
      {loading ? (
        <div className="h-7 w-32 rounded bg-slate-100 animate-pulse mb-1" />
      ) : (
        <b className={`block text-[24px] tabular-nums ${tone}`}>{format(n)}</b>
      )}
      <span className="text-sm text-ink-muted font-bold">{label}</span>
    </div>
  );
}

/* ---------------- Page ---------------- */
function Dashboard() {
  return (
    <>
      <AdminTopbar title="Dashboard" subtitle="Tổng quan vận hành – dữ liệu thời gian thực" />

      <KpiStrip />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ServiceRevenueChart />
        <ProductRevenueChart />
        <BookingStatusChart />
        <CustomerMixChart />
        <NetProfitChart />
        <TopBestsellersChart />
        <TreatmentFunnelChart />
        <BookingHeatmapCard />
        <LowStockCard />
        <ExpenseChart />
      </div>
    </>
  );
}
