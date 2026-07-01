import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EmployeeRole = "manager" | "sale" | "technician" | "admin";

type CreateEmployeeInput = {
  email: string;
  password: string;
  full_name: string;
  role: EmployeeRole;
};

// Map the human-facing role stored in public.users.role → app_role used by
// public.user_roles (which drives has_role() and every admin-side RLS policy).
function toAppRole(role: EmployeeRole): "admin" | "manager" | "staff" {
  if (role === "admin") return "admin";
  if (role === "manager") return "manager";
  return "staff"; // sale / technician
}

function validate(input: unknown): CreateEmployeeInput {
  if (!input || typeof input !== "object") throw new Error("Invalid payload");
  const raw = input as Record<string, unknown>;
  const email = String(raw.email ?? "").trim().toLowerCase();
  const password = String(raw.password ?? "");
  const full_name = String(raw.full_name ?? "").trim();
  const role = String(raw.role ?? "") as EmployeeRole;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email không hợp lệ");
  if (password.length < 6) throw new Error("Mật khẩu tối thiểu 6 ký tự");
  if (!full_name) throw new Error("Vui lòng nhập họ tên");
  if (!["manager", "sale", "technician", "admin"].includes(role)) {
    throw new Error("Vai trò không hợp lệ");
  }
  return { email, password, full_name, role };
}

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Xác thực vai trò người gọi từ bảng user_roles (nguồn sự thật RBAC).
    const [{ data: isAdmin }, { data: isManager }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "manager" }),
    ]);

    if (!isAdmin && !isManager) {
      throw new Error("Bạn không có quyền tạo nhân viên");
    }
    // Manager chỉ được tạo sale / kỹ thuật viên.
    if (!isAdmin && (data.role === "admin" || data.role === "manager")) {
      throw new Error("Quản lý chỉ được tạo tài khoản Sale hoặc Kỹ thuật viên");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Tạo tài khoản Auth (email đã xác thực để đăng nhập ngay).
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

    // Đồng bộ hồ sơ nhân sự (public.users) — lưu role gốc để hiển thị.
    const { error: upsertErr } = await supabaseAdmin.from("users").upsert(
      {
        id: newUserId,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
      },
      { onConflict: "id" },
    );
    if (upsertErr) throw new Error(upsertErr.message);

    // Cấp quyền qua user_roles (nguồn sự thật cho has_role / RLS).
    const appRole = toAppRole(data.role);
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: newUserId, role: appRole }, { onConflict: "user_id,role" });
    if (roleErr) throw new Error(roleErr.message);

    return { id: newUserId, email: data.email, role: data.role };
  });
