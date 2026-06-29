import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_public/lookup")({
  component: LookupPage,
});

type Treatment = {
  id: string;
  package_name: string | null;
  total_sessions: number | null;
  used_sessions: number | null;
  remaining_sessions: number | null;
  status: string | null;
};

function LookupPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [rows, setRows] = useState<Treatment[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(false);
    setRows([]);
    setCustomerName(null);
    try {
      const { data: cust, error: cErr } = await supabase
        .from("customers")
        .select("id,name")
        .eq("phone", phone.trim())
        .maybeSingle();
      if (cErr) throw cErr;
      if (!cust) {
        setSearched(true);
        return;
      }
      setCustomerName(cust.name ?? null);
      const { data: tts, error: tErr } = await supabase
        .from("treatments")
        .select("id,package_name,total_sessions,used_sessions,remaining_sessions,status")
        .eq("customer_id", cust.id)
        .order("created_at", { ascending: false });
      if (tErr) throw tErr;
      setRows((tts ?? []) as Treatment[]);
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
        Nhập số điện thoại bạn đã đăng ký để xem tiến độ các liệu trình hiện tại.
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

      {loading && (
        <div className="mt-6 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && searched && rows.length === 0 && (
        <div className="mt-6 bg-white border border-hairline rounded-2xl p-8 text-center text-ink-muted font-semibold">
          Không tìm thấy liệu trình nào với SĐT này.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="mt-6">
          {customerName && (
            <p className="mb-3 text-sm">
              Khách hàng: <b className="text-brand-dark">{customerName}</b>
            </p>
          )}
          <div className="overflow-auto bg-white border border-hairline rounded-2xl">
            <table className="w-full min-w-[640px] border-collapse">
              <thead>
                <tr>
                  {["Tên gói", "Tổng buổi", "Đã dùng", "Còn lại", "Trạng thái"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const used = r.used_sessions ?? 0;
                  const total = r.total_sessions ?? 0;
                  const remaining = r.remaining_sessions ?? Math.max(total - used, 0);
                  return (
                    <tr key={r.id}>
                      <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">
                        {r.package_name ?? "—"}
                      </td>
                      <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{total}</td>
                      <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{used}</td>
                      <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-bold text-brand-dark">
                        {remaining}
                      </td>
                      <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                        {r.status ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
