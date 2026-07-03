import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Store } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAllNavigationItems, type NavigationItem } from "@/lib/useNavigationItems";
import { AdminTopbar } from "@/components/AdminTopbar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemSettings, useUpdateSystemSettings } from "@/lib/useSystemSettings";



export const Route = createFileRoute("/admin/navigation")({
  component: AdminNavigationPage,
});

function AdminNavigationPage() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useAllNavigationItems();

  const toggleMut = useMutation({
    mutationFn: async (args: { id: string; is_visible: boolean }) => {
      const { error } = await supabase
        .from("navigation_items")
        .update({ is_visible: args.is_visible })
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật hiển thị menu");
      qc.invalidateQueries({ queryKey: ["navigation_items"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const homepageItems = items.filter((i) => i.platform === "homepage");
  const appItems = items.filter((i) => i.platform === "app");

  return (
    <div className="space-y-4">
      <AdminTopbar title="Quản lý Trang chủ" subtitle="Bật/tắt các mục menu điều hướng động" />

      <StoreVisibilityCard />

      {isLoading ? (
        <div className="rounded-2xl border border-hairline bg-white p-8 text-center text-ink-muted">
          <Loader2 className="w-4 h-4 animate-spin inline" /> Đang tải…
        </div>
      ) : (
        <div className="rounded-2xl border border-hairline bg-white shadow-sm p-4 md:p-6">
          <Tabs defaultValue="homepage">
            <TabsList>
              <TabsTrigger value="homepage">Website PC (/homepage)</TabsTrigger>
              <TabsTrigger value="app">Mobile App (Quick Access)</TabsTrigger>
            </TabsList>

            <TabsContent value="homepage" className="mt-4">
              <NavList
                items={homepageItems}
                onToggle={(id, v) => toggleMut.mutate({ id, is_visible: v })}
                emptyLabel="Chưa có mục menu homepage"
                note="Điều khiển menu điều hướng ở header website (không đụng đến CTA và nút Đăng nhập)."
              />
            </TabsContent>

            <TabsContent value="app" className="mt-4">
              <NavList
                items={appItems}
                onToggle={(id, v) => toggleMut.mutate({ id, is_visible: v })}
                emptyLabel="Chưa có mục Quick Access"
                note="Điều khiển cụm biểu tượng Quick Access ở trang chủ mobile. Bottom Navigation Bar KHÔNG bị ảnh hưởng."
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function NavList({
  items,
  onToggle,
  emptyLabel,
  note,
}: {
  items: NavigationItem[];
  onToggle: (id: string, v: boolean) => void;
  emptyLabel: string;
  note: string;
}) {
  if (!items.length) {
    return <div className="p-8 text-center text-ink-muted italic">{emptyLabel}</div>;
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-muted italic">{note}</p>
      <div className="rounded-xl border border-hairline overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto] px-4 py-2 bg-[#f7faf5] text-xs font-bold uppercase tracking-wider text-ink-muted">
          <div>Label</div>
          <div>Route</div>
          <div>Hiển thị</div>
        </div>
        {items.map((it) => (
          <div
            key={it.id}
            className="grid grid-cols-[1fr_1fr_auto] items-center px-4 py-3 border-t border-hairline hover:bg-[#fafcf7]"
          >
            <div className="font-bold text-ink">{it.label}</div>
            <div className="font-mono text-xs text-ink-muted truncate">{it.route}</div>
            <Switch
              checked={it.is_visible}
              onCheckedChange={(v) => onToggle(it.id, v)}
              aria-label={`Bật/tắt ${it.label}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StoreVisibilityCard() {
  const { data: sys, isLoading } = useSystemSettings();
  const update = useUpdateSystemSettings();
  const checked = sys?.show_store_list ?? true;
  return (
    <div className="rounded-2xl border border-hairline bg-white p-4 md:p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 grid place-items-center text-emerald-700">
          <Store className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-ink">Danh sách Cửa hàng</h3>
          <p className="text-xs text-ink-muted">
            Hiển thị/ẩn khối danh sách cơ sở trên Trang chủ (PC & Mobile) và trang Cửa hàng.
          </p>
        </div>
        <Switch
          checked={checked}
          disabled={isLoading || update.isPending}
          onCheckedChange={(v) => {
            update.mutate(
              { show_store_list: v },
              {
                onSuccess: () =>
                  toast.success(v ? "Đã BẬT hiển thị Cửa hàng" : "Đã TẮT hiển thị Cửa hàng"),
                onError: (e: unknown) =>
                  toast.error(e instanceof Error ? e.message : "Không cập nhật được"),
              },
            );
          }}
          aria-label="Bật/tắt hiển thị Cửa hàng"
        />
      </div>
    </div>
  );
}
