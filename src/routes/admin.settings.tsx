import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient";
import { useSettings, type Settings } from "@/lib/useSettings";

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

function SettingsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useSettings();
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      const next: Record<string, string> = {};
      FIELDS.forEach((f) => {
        next[f.name] = (data[f.name] as string) ?? "";
      });
      setForm(next);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, string> = {};
      FIELDS.forEach((f) => (payload[f.name] = form[f.name] ?? ""));
      const { error } = await supabase.from("settings").update(payload).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã lưu cài đặt");
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message || "Lưu thất bại"),
  });

  return (
    <>
      <AdminTopbar
        title="Cài đặt thương hiệu"
        subtitle="Thông tin sẽ hiển thị trên Header, Footer và trang Liên hệ."
      />

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          {(error as Error).message}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="bg-white border border-hairline rounded-2xl p-5 grid gap-4 max-w-2xl"
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />
          ))
        ) : (
          FIELDS.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                />
              ) : (
                <Input
                  id={f.name}
                  value={form[f.name] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
                />
              )}
            </div>
          ))
        )}
        <div>
          <Button type="submit" disabled={save.isPending || isLoading}>
            {save.isPending ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </>
  );
}
