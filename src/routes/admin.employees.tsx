import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, ShieldPlus, UserPlus } from "lucide-react";
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
import { createEmployee } from "@/lib/employees.functions";

export const Route = createFileRoute("/admin/employees")({
  component: EmployeesAdmin,
});

type RoleDef = { key: string; label: string; app_role: string; is_system: boolean };

function EmployeesAdmin() {
  const { role: myRole } = useAuth();
  const isAdmin = myRole === "admin";
  const canCreate = isAdmin || myRole === "manager";

  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [roleDefs, setRoleDefs] = useState<RoleDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const roleLabel = useMemo(() => {
    const m: Record<string, string> = {
      admin: "Admin", manager: "Quản lý", sale: "Sale",
      technician: "Kỹ thuật viên", staff: "Nhân viên", customer: "Khách hàng",
    };
    for (const r of roleDefs) m[r.key] = r.label;
    return m;
  }, [roleDefs]);

  const [form, setForm] = useState({
    email: "", password: "", full_name: "",
    role: isAdmin ? "manager" : "sale",
  });
  const [submitting, setSubmitting] = useState(false);

  // Form thêm Role mới
  const [newRole, setNewRole] = useState({ key: "", label: "", app_role: "staff" });
  const [savingRole, setSavingRole] = useState(false);

  const createFn = useServerFn(createEmployee);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        supabase
          .from("users")
          .select("id, full_name, email, role, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("role_definitions")
          .select("key, label, app_role, is_system")
          .order("is_system", { ascending: false })
          .order("label"),
      ]);
      if (!active) return;
      if (usersRes.error) setError(usersRes.error.message);
      else setUsers(usersRes.data ?? []);
      if (!rolesRes.error) setRoleDefs((rolesRes.data ?? []) as RoleDef[]);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [reloadKey]);

  // Danh sách vai trò cho dropdown tạo NV: manager chỉ được chọn role có app_role='staff'
  const roleOptions = useMemo(
    () => (isAdmin ? roleDefs : roleDefs.filter((r) => r.app_role === "staff")),
    [isAdmin, roleDefs],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setSubmitting(true);
    try {
      await createFn({ data: form });
      toast.success(`Đã tạo tài khoản ${form.email}`);
      setForm({ email: "", password: "", full_name: "", role: isAdmin ? "manager" : "sale" });
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    const key = newRole.key.trim().toLowerCase().replace(/\s+/g, "_");
    const label = newRole.label.trim();
    if (!key || !label) return toast.error("Nhập đủ mã và tên vai trò");
    setSavingRole(true);
    const { error } = await supabase.from("role_definitions").insert({
      key, label, app_role: newRole.app_role, is_system: false,
    });
    setSavingRole(false);
    if (error) return toast.error(error.message);
    toast.success(`Đã thêm vai trò "${label}"`);
    setNewRole({ key: "", label: "", app_role: "staff" });
    setReloadKey((k) => k + 1);
  };

  return (
    <>
      <AdminTopbar
        title="Tài khoản"
        subtitle={loading ? "Đang tải..." : `${users.length} tài khoản · ${roleDefs.length} vai trò`}
      />

      {error && (
        <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
          Lỗi tải dữ liệu: {error}
        </div>
      )}

      {canCreate && (
        <div className="grid gap-5 mb-5 lg:grid-cols-2">
          <form onSubmit={onSubmit} className="bg-white border border-hairline rounded-2xl p-4 grid gap-3">
            <div className="flex items-center gap-2 text-sm font-black text-brand-dark">
              <UserPlus size={18} /> Tạo tài khoản nhân viên
              {!isAdmin && (
                <span className="ml-2 text-[11px] font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 px-2 py-0.5">
                  Manager chỉ tạo được cấp Nhân viên
                </span>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Họ tên</Label>
                <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mật khẩu</Label>
                <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Vai trò</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r.key} value={r.key}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? <><Loader2 className="animate-spin" size={16} /> Đang tạo…</> : <><UserPlus size={16} /> Tạo tài khoản</>}
            </Button>
          </form>

          <form onSubmit={onAddRole} className="bg-white border border-hairline rounded-2xl p-4 grid gap-3">
            <div className="flex items-center gap-2 text-sm font-black text-brand-dark">
              <ShieldPlus size={18} /> Danh mục vai trò
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Mã (key)</Label>
                <Input value={newRole.key} onChange={(e) => setNewRole({ ...newRole, key: e.target.value })} placeholder="vd: reception" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tên hiển thị</Label>
                <Input value={newRole.label} onChange={(e) => setNewRole({ ...newRole, label: e.target.value })} placeholder="Lễ tân" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nhóm quyền</Label>
                <Select value={newRole.app_role} onValueChange={(v) => setNewRole({ ...newRole, app_role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Nhân viên (staff)</SelectItem>
                    {isAdmin && <SelectItem value="manager">Quản lý (manager)</SelectItem>}
                    {isAdmin && <SelectItem value="admin">Quản trị (admin)</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={savingRole} variant="secondary">
              <Plus size={16} /> {savingRole ? "Đang thêm…" : "Thêm vai trò mới"}
            </Button>
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-hairline">
              {roleDefs.map((r) => (
                <span
                  key={r.key}
                  className={`text-[11px] px-2 py-1 rounded-full font-semibold ${
                    r.is_system ? "bg-brand-bg text-ink" : "bg-emerald-100 text-emerald-800"
                  }`}
                  title={`app_role: ${r.app_role}`}
                >
                  {r.label}
                </span>
              ))}
            </div>
          </form>
        </div>
      )}

      <DataTable
        columns={[
          { key: "full_name", label: "Họ tên", sortable: true },
          { key: "email", label: "Email", sortable: true },
          {
            key: "role",
            label: "Vai trò",
            sortable: true,
            sortValue: (row) => roleLabel[String(row.role ?? "")] ?? String(row.role ?? ""),
            render: (row) => roleLabel[String(row.role ?? "")] ?? String(row.role ?? "—"),
          },
          {
            key: "created_at",
            label: "Ngày tạo",
            sortable: true,
            sortValue: (row) =>
              row.created_at ? new Date(String(row.created_at)) : null,
            render: (row) =>
              row.created_at ? new Date(String(row.created_at)).toLocaleDateString("vi-VN") : "—",
          },
        ]}
        rows={users}
      />

    </>
  );
}
