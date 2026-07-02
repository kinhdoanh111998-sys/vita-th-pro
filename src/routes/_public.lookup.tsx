import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_public/lookup")({
  component: LookupPage,
});

type Session = { session_number: number | null; status: string | null };
type Pkg = {
  order_id: string;
  package_name: string;
  total_sessions: number;
  used_sessions: number;
  remaining_sessions: number;
  sessions: Session[];
};

const statusLabel = (s: string | null) => {
  if (s === "done" || s === "completed") return { label: "Đã làm", cls: "bg-emerald-100 text-emerald-800" };
  if (s === "in_progress") return { label: "Đang thực hiện", cls: "bg-blue-100 text-blue-800" };
  return { label: "Chưa làm", cls: "bg-slate-100 text-slate-600" };
};

function LookupPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(false);
    setPackages([]);
    setCustomerName(null);
    try {
      const res = await fetch("/api/public/lookup-treatments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Không tra cứu được");
      setCustomerName(json.customer?.name ?? null);
      setPackages(json.packages ?? []);
      setSearched(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black tracking-tight text-brand-dark mb-2">
        Tra cứu liệu trình
      </h1>
      <p className="text-ink-muted mb-6">
        Nhập số điện thoại bạn đã đăng ký để xem tiến độ các liệu trình.
      </p>

      <form
        onSubmit={onSubmit}
        className="bg-white border border-hairline rounded-2xl p-5 flex flex-col sm:flex-row sm:items-end gap-3"
      >
        <div className="flex-1">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="VD: 0901xxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Đang tra cứu..." : "Tra cứu"}
        </Button>
      </form>

      {error && (
        <div className="mt-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          {error}
        </div>
      )}

      {!loading && searched && packages.length === 0 && (
        <div className="mt-6 bg-white border border-hairline rounded-2xl p-8 text-center text-ink-muted font-semibold">
          Không tìm thấy liệu trình nào với SĐT này.
        </div>
      )}

      {!loading && packages.length > 0 && (
        <div className="mt-6 space-y-4">
          {customerName && (
            <p className="text-sm">
              Khách hàng: <b className="text-brand-dark">{customerName}</b>
            </p>
          )}
          {packages.map((p) => (
            <div key={p.order_id} className="bg-white border border-hairline rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h3 className="font-black text-lg text-brand-dark">{p.package_name}</h3>
                <div className="text-sm">
                  <span className="text-ink-muted">Tiến độ: </span>
                  <b className="text-brand-dark">{p.used_sessions}/{p.total_sessions}</b>
                  <span className="ml-2 text-emerald-700 font-semibold">
                    (Còn {p.remaining_sessions})
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {p.sessions.map((s, i) => {
                  const st = statusLabel(s.status);
                  return (
                    <div
                      key={i}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold ${st.cls}`}
                    >
                      <div className="text-[11px] opacity-70">Buổi {s.session_number ?? i + 1}</div>
                      <div>{st.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
