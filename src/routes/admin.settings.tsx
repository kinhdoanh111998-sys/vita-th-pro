import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Save, ShieldCheck, Building2, Phone, Loader2 } from "lucide-react";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { supabase as cloudSupabase } from "@/integrations/supabase/client";
import { useSettings, type Settings } from "@/lib/useSettings";
import { useSystemSettings, SYSTEM_SETTINGS_KEY } from "@/lib/useSystemSettings";
import { downloadCSV, toCSV } from "@/lib/csv";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsAdmin,
});

const FIELDS: { name: keyof Settings; label: string; type?: "textarea" }[] = [
  { name: "brand", label: "Tên thương hiệu" },
  { name: "tagline", label: "Slogan / Mô tả ngắn" },
  { name: "hotline", label: "Hotline" },
  { name: "zalo", label: "Zalo" },
  { name: "email", label: "Email" },
  { name: "address", label: "Địa chỉ", type: "textarea" },
];

const EXPORT_TABLES: { table: string; label: string; columns: { key: string; label: string }[] }[] = [
  {
    table: "services", label: "Kho Sản phẩm / Dịch vụ",
    columns: [
      { key: "id", label: "ID" }, { key: "sku", label: "Mã SKU" },
      { key: "name", label: "Tên" }, { key: "type", label: "Loại" },
      { key: "category", label: "Danh mục" },
      { key: "price", label: "Giá bán" }, { key: "sale_price", label: "Giá KM" },
      { key: "cost_price", label: "Giá nhập" },
      { key: "stock_quantity", label: "Tồn kho" },
      { key: "default_sessions", label: "Số buổi" },
      { key: "is_hidden", label: "Ẩn" }, { key: "created_at", label: "Ngày tạo" },
    ],
  },
  {
    table: "orders", label: "Giao dịch / Đơn hàng",
    columns: [
      { key: "order_code", label: "Mã đơn" }, { key: "customer_id", label: "Khách hàng ID" },
      { key: "sales_staff_id", label: "NV bán" },
      { key: "subtotal_amount", label: "Tạm tính" },
      { key: "discount_amount", label: "Giảm giá" },
      { key: "total_amount", label: "Tổng tiền" },
      { key: "commission_rate", label: "% Hoa hồng" },
      { key: "status", label: "Trạng thái" }, { key: "created_at", label: "Ngày mua" },
    ],
  },
  {
    table: "customers", label: "Khách hàng",
    columns: [
      { key: "id", label: "ID" }, { key: "name", label: "Họ tên" },
      { key: "phone", label: "SĐT" }, { key: "email", label: "Email" },
      { key: "source", label: "Nguồn" }, { key: "status", label: "Trạng thái" },
      { key: "note", label: "Ghi chú" }, { key: "created_at", label: "Ngày tạo" },
    ],
  },
  {
    table: "bookings", label: "Lịch hẹn",
    columns: [
      { key: "id", label: "ID" }, { key: "customer_name", label: "Khách hàng" },
      { key: "phone", label: "SĐT" }, { key: "service", label: "Dịch vụ" },
      { key: "booking_date", label: "Ngày" }, { key: "booking_time", label: "Giờ" },
      { key: "status", label: "Trạng thái" }, { key: "note", label: "Ghi chú" },
      { key: "created_at", label: "Ngày tạo" },
    ],
  },
];

function SettingsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useSettings();
  const { data: sys, isLoading: sysLoading } = useSystemSettings();
  const [form, setForm] = useState<Record<string, string>>({});
  const [sysForm, setSysForm] = useState({ hotline: "", zalo_link: "", facebook_link: "" });
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      const next: Record<string, string> = {};
      FIELDS.forEach((f) => { next[f.name] = (data[f.name] as string) ?? ""; });
      setForm(next);
    }
  }, [data]);

  useEffect(() => {
    if (sys) {
      setSysForm({
        hotline: sys.hotline ?? "",
        zalo_link: sys.zalo_link ?? "",
        facebook_link: sys.facebook_link ?? "",
      });
    }
  }, [sys]);

  const saveSystem = useMutation({
    mutationFn: async () => {
      if (!sys?.id) {
        const { error } = await cloudSupabase.from("system_settings").insert(sysForm);
        if (error) throw error;
      } else {
        const { error } = await cloudSupabase
          .from("system_settings")
          .update(sysForm)
          .eq("id", sys.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đã cập nhật thông tin liên hệ");
      qc.invalidateQueries({ queryKey: SYSTEM_SETTINGS_KEY });
    },
    onError: (e: Error) => toast.error(e.message || "Lưu thất bại"),
  });


  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string> = {};
      FIELDS.forEach((f) => (payload[f.name] = form[f.name] ?? ""));
      console.info("Brand settings payload is currently display-only", payload);
    },
    onSuccess: () => {
      toast.success("Đã lưu cài đặt hiển thị");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message || "Lưu thất bại"),
  });

  const exportTable = async (cfg: typeof EXPORT_TABLES[number]) => {
    setExporting(cfg.table);
    try {
      const { data, error } = await supabase.from(cfg.table).select("*");
      if (error) throw error;
      const rows = (data ?? []) as Record<string, unknown>[];
      if (rows.length === 0) {
        toast.info(`Bảng ${cfg.label} đang trống`);
        return;
      }
      const csv = toCSV(rows, cfg.columns.map((c) => ({
        key: c.key,
        label: c.label,
        format: (v) => v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v),
      })));
      const today = new Date().toISOString().slice(0, 10);
      downloadCSV(`${cfg.table}-${today}.csv`, csv);
      toast.success(`Đã xuất ${rows.length} dòng ${cfg.label}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <AdminTopbar title="Cài đặt hệ thống" subtitle="Quản lý thương hiệu và sao lưu dữ liệu nội bộ." />

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          {(error as Error).message}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Khu vực 0 — Liên hệ toàn cục (Header/Footer) */}
        <section className="bg-white border border-hairline rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-hairline">
            <div className="size-10 grid place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <Phone size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg">Liên hệ toàn cục</h2>
              <p className="text-xs text-ink-muted">
                Đồng bộ Hotline / Zalo / Facebook ra Header &amp; Footer trang chủ.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); saveSystem.mutate(); }}
            className="grid gap-4 md:grid-cols-3"
          >
            {sysLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
              ))
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="sys_hotline">Hotline</Label>
                  <Input
                    id="sys_hotline"
                    value={sysForm.hotline}
                    onChange={(e) => setSysForm((p) => ({ ...p, hotline: e.target.value }))}
                    placeholder="0988 000 888"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sys_zalo">Link Zalo</Label>
                  <Input
                    id="sys_zalo"
                    value={sysForm.zalo_link}
                    onChange={(e) => setSysForm((p) => ({ ...p, zalo_link: e.target.value }))}
                    placeholder="https://zalo.me/..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sys_fb">Link Facebook</Label>
                  <Input
                    id="sys_fb"
                    value={sysForm.facebook_link}
                    onChange={(e) => setSysForm((p) => ({ ...p, facebook_link: e.target.value }))}
                    placeholder="https://facebook.com/..."
                  />
                </div>
              </>
            )}
            <div className="md:col-span-3">
              <Button type="submit" disabled={saveSystem.isPending || sysLoading}>
                {saveSystem.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saveSystem.isPending ? "Đang lưu..." : "Lưu liên hệ"}
              </Button>
            </div>
          </form>
        </section>

        {/* Khu vực 1 — Thông tin hệ thống */}
        <section className="bg-white border border-hairline rounded-2xl p-6 shadow-sm">

          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-hairline">
            <div className="size-10 grid place-items-center rounded-xl bg-brand-soft text-brand-dark">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg">Thông tin thương hiệu</h2>
              <p className="text-xs text-ink-muted">Hiển thị trên Header, Footer và trang Liên hệ.</p>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="grid gap-4">
            {isLoading ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
            )) : FIELDS.map((f) => (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={f.name}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea id={f.name} value={form[f.name] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))} />
                ) : (
                  <Input id={f.name} value={form[f.name] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))} />
                )}
              </div>
            ))}
            <div>
              <Button type="submit" disabled={save.isPending || isLoading}>
                <Save size={16} /> {save.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </form>
        </section>

        {/* Khu vực 2 — Bảo mật & Dữ liệu */}
        <section className="bg-white border border-hairline rounded-2xl p-6 shadow-sm h-fit">
          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-hairline">
            <div className="size-10 grid place-items-center rounded-xl bg-amber-50 text-amber-700">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="font-black text-lg">Bảo mật & Dữ liệu</h2>
              <p className="text-xs text-ink-muted">Sao lưu / xuất dữ liệu nội bộ dưới dạng CSV.</p>
            </div>
          </div>

          <div className="space-y-3">
            {EXPORT_TABLES.map((cfg) => (
              <div key={cfg.table} className="flex items-center justify-between gap-3 border border-hairline rounded-2xl px-4 py-3 bg-gradient-to-r from-brand-soft/40 to-white">
                <div>
                  <div className="font-bold">{cfg.label}</div>
                  <div className="text-xs text-ink-muted">Bảng <code>{cfg.table}</code></div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => exportTable(cfg)} disabled={exporting === cfg.table}>
                  <Download size={14} /> {exporting === cfg.table ? "Đang xuất..." : "Xuất CSV"}
                </Button>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-ink-muted leading-relaxed">
            File CSV được tạo trực tiếp trong trình duyệt (UTF-8 BOM) — mở được trên Excel, Google Sheets và Numbers.
          </p>
        </section>
      </div>
    </>
  );
}
