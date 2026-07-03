import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "url";
  required?: boolean;
  placeholder?: string;
};

type Props = {
  title: string;
  table: string;
  fields: Field[];
  columns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[];
};

export function CrudAdminPage({ title, table, fields, columns }: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from(table).select("*").order("created_at", {
      ascending: false,
    });
    if (error) {
      // Fallback without order (in case created_at missing)
      const retry = await supabase.from(table).select("*");
      if (retry.error) setError(retry.error.message);
      else setRows(retry.data ?? []);
    } else {
      setRows(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const resetForm = () => {
    const blank: Record<string, string> = {};
    fields.forEach((f) => (blank[f.name] = ""));
    setForm(blank);
  };

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (v) resetForm();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = form[f.name];
      if (raw === undefined || raw === "") continue;
      payload[f.name] = f.type === "number" ? Number(raw) : raw;
    }
    const { error } = await supabase.from(table).insert(payload);
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOpen(false);
    await load();
  };

  return (
    <>
      <AdminTopbar
        title={title}
        subtitle={loading ? "Đang tải..." : `${rows.length} bản ghi`}
        right={
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <Button>+ Thêm mới</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Thêm mới {title.toLowerCase()}</DialogTitle>
              </DialogHeader>
              <form onSubmit={onSubmit} className="space-y-3">
                {fields.map((f) => (
                  <div key={f.name} className="space-y-1.5">
                    <Label htmlFor={f.name}>
                      {f.label}
                      {f.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {f.type === "textarea" ? (
                      <Textarea
                        id={f.name}
                        required={f.required}
                        placeholder={f.placeholder}
                        value={form[f.name] ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                      />
                    ) : (
                      <Input
                        id={f.name}
                        type={f.type === "number" ? "number" : f.type === "url" ? "url" : "text"}
                        required={f.required}
                        placeholder={f.placeholder}
                        value={form[f.name] ?? ""}
                        onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-2.5">
                    {error}
                  </div>
                )}
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Huỷ
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Đang lưu..." : "Lưu"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {error && !open && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          Lỗi tải dữ liệu: {error}
        </div>
      )}

      <div className="overflow-auto bg-brand-surface border border-brand-border rounded-[12px] shadow-soft">
        <table className="w-full min-w-[760px] border-collapse">
          <thead>
            <tr className="bg-brand-bg">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-brand-muted border-b border-brand-border"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-brand-muted text-[14px]"
                >
                  Chưa có dữ liệu, vui lòng bấm nút <span className="text-brand-primary font-semibold">Thêm mới</span>.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={(row.id as string) ?? i}
                  className="hover:bg-brand-bg transition-colors border-b border-brand-border last:border-b-0"
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className="px-4 py-3 text-[14px] text-brand-text align-middle"
                    >
                      {c.render ? c.render(row) : String(row[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </>
  );
}
