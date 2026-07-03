import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";

export type CustomerLite = { id: string; name: string | null; phone: string | null };

/**
 * Reusable customer picker: combobox tìm kiếm khách sẵn có + tạo khách mới ngay tại chỗ.
 * Sau khi tạo, khách mới được gán làm giá trị đang chọn.
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
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const [justCreated, setJustCreated] = useState<CustomerLite | null>(null);

  useEffect(() => {
    if (justCreated && customers.some((c) => c.id === justCreated.id)) {
      setJustCreated(null);
    }
  }, [customers, justCreated]);

  const mergedCustomers = useMemo(() => {
    if (!justCreated) return customers;
    if (customers.some((c) => c.id === justCreated.id)) return customers;
    return [justCreated, ...customers];
  }, [customers, justCreated]);

  const selected = value && value !== "__new"
    ? mergedCustomers.find((c) => c.id === value) ?? null
    : null;

  const triggerLabel = value === "__new" || !value
    ? "+ Khách mới (nhập tay bên dưới)"
    : selected
      ? `${selected.name ?? "—"}${selected.phone ? ` · ${selected.phone}` : ""}`
      : "Chọn khách";

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

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="h-4 w-4 text-ink-muted shrink-0" />
              <span className="truncate">{triggerLabel}</span>
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-w-[calc(100vw-2rem)]" align="start">
          <Command>
            <CommandInput placeholder="Tìm theo tên hoặc SĐT..." />
            <CommandList>
              <CommandEmpty>Không tìm thấy khách phù hợp.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="__new"
                  keywords={["khách mới", "them moi", "them khach"]}
                  onSelect={() => { onChange("__new"); setOpen(false); }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === "__new" ? "opacity-100" : "opacity-0")} />
                  + Khách mới (nhập tay bên dưới)
                </CommandItem>
                {mergedCustomers.map((c) => {
                  const nm = c.name ?? "—";
                  const ph = c.phone ?? "";
                  return (
                    <CommandItem
                      key={c.id}
                      value={`${nm} ${ph} ${c.id}`}
                      keywords={[nm, ph]}
                      onSelect={() => { onChange(c.id); setOpen(false); }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === c.id ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">{nm}{ph ? ` · ${ph}` : ""}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

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
