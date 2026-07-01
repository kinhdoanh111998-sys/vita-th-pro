import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { AdminTopbar } from "@/components/AdminTopbar";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/AuthContext";
import { createEmployee, type EmployeeRole } from "@/lib/employees.functions";

export const Route = createFileRoute("/admin/employees")({
  component: EmployeesAdmin,
});

const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  manager: "Quản lý",
  sale: "Sale",
  technician: "Kỹ thuật viên",
  staff: "Nhân viên",
  customer: "Khách hàng",
};

function EmployeesAdmin() {
  const { role: myRole } = useAuth();
  const isAdmin = myRole === "admin";
  const canCreate = isAdmin || myRole === "manager";

  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: (isAdmin ? "manager" : "sale") as EmployeeRole,
  });
  const [submitting, setSubmitting] = useState(false);

  const createFn = useServerFn(createEmployee);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, email, role, created_at")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        // Retry không có order (đề phòng thiếu cột)
        const retry = await supabase.from("users").select("*");
        if (retry.error) setError(retry.error.message);
        else setRows(retry.data ?? []);
      } else {
        setRows(data ?? []);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const roleOptions = useMemo<EmployeeRole[]>(
    () => (isAdmin ? ["manager", "sale", "technician", "admin"] : ["sale", "technician"]),
    [isAdmin],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setSubmitting(true);
    try {
      await createFn({ data: form });
      toast.success(`Đã tạo tài khoản ${form.email}`);
      setForm({
        email: "",
        password: "",
        full_name: "",
        role: isAdmin ? "manager" : "sale",
      });
      setReloadKey((k) => k + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AdminTopbar
        title="Nhân viên"
        subtitle={loading ? "Đang tải..." : `${rows.length} bản ghi`}
      />

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          Lỗi tải dữ liệu: {error}
        </div>
      )}

      {canCreate && (
        <form
          onSubmit={onSubmit}
          className="mb-5 bg-white border border-hairline rounded-2xl p-4 grid gap-3 md:grid-cols-5"
        >
          <div className="md:col-span-5 flex items-center gap-2 text-sm font-black text-brand-dark">
            <UserPlus size={18} /> Tạo tài khoản nhân viên
            {!isAdmin && (
              <span className="ml-2 text-[11px] font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                Quản lý chỉ được tạo Sale / Kỹ thuật viên
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Họ tên</Label>
            <Input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Nguyễn Văn A"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email đăng nhập</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@vitath.pro"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mật khẩu</Label>
            <Input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Tối thiểu 6 ký tự"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Vai trò</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v as EmployeeRole })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Đang tạo…
                </>
              ) : (
                <>
                  <UserPlus size={16} /> Tạo tài khoản
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      <DataTable
        columns={[
          { key: "full_name", label: "Họ tên" },
          { key: "email", label: "Email" },
          {
            key: "role",
            label: "Vai trò",
            render: (row) => ROLE_LABEL[String(row.role ?? "")] ?? String(row.role ?? "—"),
          },
          {
            key: "created_at",
            label: "Ngày tạo",
            render: (row) =>
              row.created_at ? new Date(String(row.created_at)).toLocaleDateString("vi-VN") : "—",
          },
        ]}
        rows={rows}
      />
    </>
  );
}
