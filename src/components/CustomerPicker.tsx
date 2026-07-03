import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type CustomerLite = { id: string; name: string | null; phone: string | null };

/**
 * Reusable customer picker: chọn khách sẵn có hoặc tạo khách mới ngay tại chỗ.
 * Sau khi tạo khách mới, tự động gán khách đó làm giá trị đang chọn.
 */
export function CustomerPicker({
  customers,
  value,
  onChange,
  onCreated,
  label = "Khách hàng",
}: {
  customers: CustomerLite[];
  value: string; // "__new" or customer id
  onChange: (id: string) => void;
  onCreated?: (c: CustomerLite) => void;
  label?: string;
}) {
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);
  // Khách vừa tạo — giữ tạm trong picker để đảm bảo SelectItem tồn tại
  // ngay lập tức, kể cả khi cache useQuery của parent chưa kịp cập nhật.
  const [justCreated, setJustCreated] = useState<CustomerLite | null>(null);

  // Khi customers prop đã có khách vừa tạo (parent đã refetch), gỡ khỏi local.
  useEffect(() => {
    if (justCreated && customers.some((c) => c.id === justCreated.id)) {
      setJustCreated(null);
    }
  }, [customers, justCreated]);

  // Danh sách hiển thị: gộp khách vừa tạo (nếu có) lên đầu, không trùng.
  const mergedCustomers = useMemo(() => {
    if (!justCreated) return customers;
    if (customers.some((c) => c.id === justCreated.id)) return customers;
    return [justCreated, ...customers];
  }, [customers, justCreated]);

  const createNew = async () => {
    const name = newName.trim();
    const phone = newPhone.trim();
    if (!name || !phone) {
      toast.error("Nhập tên và SĐT khách hàng.");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({ name, full_name: name, phone })
        .select("id,name,phone")
        .single();
      if (error) throw error;
      const created = data as CustomerLite;
      toast.success("Tạo khách mới thành công!", { duration: 3000 });
      setNewName("");
      setNewPhone("");
      // Ghim vào picker TRƯỚC, để SelectItem tồn tại ngay khi value đổi
      // → tránh trường hợp Select rơi về placeholder "+ Khách mới".
      setJustCreated(created);
      onCreated?.(created);
      onChange(created.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label>{label} *</Label>
      <Select value={value || "__new"} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Chọn khách" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__new">+ Khách mới (nhập tay bên dưới)</SelectItem>
          {mergedCustomers.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name ?? "—"}{c.phone ? ` · ${c.phone}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value === "__new" && (
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 pt-2">
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Tên khách" />
          <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="SĐT (09xx…)" />
          <Button type="button" onClick={createNew} disabled={creating} className="whitespace-nowrap">
            {creating ? "Đang lưu…" : "+ Tạo khách"}
          </Button>
        </div>
      )}
    </div>
  );
}
