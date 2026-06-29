import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageIcon, Plus } from "lucide-react";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabaseClient";
import { money } from "@/lib/mockData";

export const Route = createFileRoute("/admin/catalog")({
  component: CatalogAdmin,
});

type Item = {
  id: string;
  type: string | null;
  name: string | null;
  price: number | null;
  summary: string | null;
  image: string | null;
  source: string | null;
  status: string | null;
};

const TYPES = ["Máy công nghệ", "Phụ kiện", "Dịch vụ", "Chuyển giao công nghệ"];
const EMPTY = { type: TYPES[0], name: "", price: "", summary: "", image: "", source: "", status: "Hiển thị" };

function CatalogAdmin() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin", "catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("catalog").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  const filtered = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => (r.type ?? "") === filter)),
    [rows, filter],
  );

  const save = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Vui lòng nhập tên sản phẩm");
      const payload = {
        type: form.type,
        name: form.name.trim(),
        price: form.price ? Number(form.price) : 0,
        summary: form.summary.trim() || null,
        image: form.image.trim() || null,
        source: form.source.trim() || null,
        status: form.status,
      };
      const { error } = await supabase.from("catalog").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã thêm sản phẩm");
      qc.invalidateQueries({ queryKey: ["admin", "catalog"] });
      setOpen(false);
      setForm(EMPTY);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <AdminTopbar
        title="Sản phẩm / Dịch vụ"
        subtitle={isLoading ? "Đang tải..." : `${filtered.length}/${rows.length} sản phẩm`}
        right={
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} /> Thêm sản phẩm
          </Button>
        }
      />

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          {(error as Error).message}
        </div>
      )}

      <div className="mb-4 bg-white border border-hairline rounded-2xl p-3 flex flex-wrap gap-3 items-end">
        <div className="space-y-1.5">
          <Label className="text-xs">Lọc theo loại</Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[240px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-auto bg-white border border-hairline rounded-2xl">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr>
              {["Ảnh", "Loại", "Tên", "Giá", "Nguồn", "Trạng thái"].map((h) => (
                <th key={h} className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !isLoading ? (
              <tr><td colSpan={6} className="px-3.5 py-10 text-center text-ink-muted font-semibold">Không có sản phẩm.</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id}>
                <td className="px-3.5 py-3 border-b border-[#edf3ed]">
                  {r.image ? (
                    <img src={r.image} alt={r.name ?? ""} className="h-14 w-20 object-cover rounded-lg" />
                  ) : (
                    <div className="h-14 w-20 rounded-lg bg-slate-100 grid place-items-center text-slate-400">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.type ?? "—"}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed] font-semibold">{r.name}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{Number(r.price) > 0 ? money(Number(r.price)) : "Liên hệ"}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">{r.source ?? "—"}</td>
                <td className="px-3.5 py-3 text-sm border-b border-[#edf3ed]">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${r.status === "Hiển thị" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`}>
                    {r.status ?? "—"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Thêm sản phẩm / dịch vụ</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Loại *</Label>
                <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hiển thị">Hiển thị</SelectItem>
                    <SelectItem value="Ẩn">Ẩn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tên *</Label>
              <Input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Giá (VND)</Label>
                <Input type="number" min={0} value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Nguồn</Label>
                <Input value={form.source} onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Ảnh (URL)</Label>
              <Input type="url" placeholder="https://..." value={form.image} onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả ngắn</Label>
              <Textarea rows={3} value={form.summary} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? "Đang lưu..." : "Lưu"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
