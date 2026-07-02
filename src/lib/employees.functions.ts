import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EmployeeRole = string;

type CreateEmployeeInput = {
  email: string;
  password: string;
  full_name: string;
  role: EmployeeRole;
};

function validate(input: unknown): CreateEmployeeInput {
  if (!input || typeof input !== "object") throw new Error("Invalid payload");
  const raw = input as Record<string, unknown>;
  const email = String(raw.email ?? "").trim().toLowerCase();
  const password = String(raw.password ?? "");
  const full_name = String(raw.full_name ?? "").trim();
  const role = String(raw.role ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email không hợp lệ");
  if (password.length < 6) throw new Error("Mật khẩu tối thiểu 6 ký tự");
  if (!full_name) throw new Error("Vui lòng nhập họ tên");
  if (!role) throw new Error("Vui lòng chọn vai trò");
  return { email, password, full_name, role };
}

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [{ data: isAdmin }, { data: isManager }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "manager" }),
    ]);
    if (!isAdmin && !isManager) throw new Error("Bạn không có quyền tạo nhân viên");

    // Tra bảng role_definitions để lấy app_role tương ứng (fallback 'staff').
    const { data: roleDef } = await supabase
      .from("role_definitions")
      .select("key, app_role")
      .eq("key", data.role)
      .maybeSingle();
    const appRole: "admin" | "manager" | "staff" =
      (roleDef?.app_role as "admin" | "manager" | "staff" | undefined) ??
      (data.role === "admin" ? "admin" : data.role === "manager" ? "manager" : "staff");

    // Manager chỉ được tạo tài khoản staff-level.
    if (!isAdmin && appRole !== "staff") {
      throw new Error("Quản lý chỉ được tạo tài khoản cấp Nhân viên (Sale/Kỹ thuật viên)");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (createErr || !created?.user) {
      throw new Error(createErr?.message ?? "Không tạo được tài khoản");
    }
    const newUserId = created.user.id;

    const { error: upsertErr } = await supabaseAdmin.from("users").upsert(
      { id: newUserId, email: data.email, full_name: data.full_name, role: data.role },
      { onConflict: "id" },
    );
    if (upsertErr) throw new Error(upsertErr.message);

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: newUserId, role: appRole }, { onConflict: "user_id,role" });
    if (roleErr) throw new Error(roleErr.message);

    return { id: newUserId, email: data.email, role: data.role };
  });
