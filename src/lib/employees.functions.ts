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

    const { data: roleDef } = await supabase
      .from("role_definitions")
      .select("key, app_role")
      .eq("key", data.role)
      .maybeSingle();
    const appRole: "admin" | "manager" | "staff" =
      (roleDef?.app_role as "admin" | "manager" | "staff" | undefined) ??
      (data.role === "admin" ? "admin" : data.role === "manager" ? "manager" : "staff");

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

/* ============================================================
 * createCustomerWithAuth
 *   Admin/Manager tạo khách hàng — tự động tạo tài khoản Auth
 *   virtualEmail = <phone>@khach.vitath.pro, password = <phone>.
 *   Dùng service role để KHÔNG làm văng phiên của Admin hiện tại.
 * ============================================================ */

type CreateCustomerInput = {
  full_name: string;
  phone: string;
  email?: string | null;
  dob?: string | null;
  gender?: string | null;
  source?: string | null;
  status?: string | null;
  notes?: string | null;
};

function validateCustomer(input: unknown): CreateCustomerInput {
  if (!input || typeof input !== "object") throw new Error("Invalid payload");
  const raw = input as Record<string, unknown>;
  const full_name = String(raw.full_name ?? "").trim();
  const phone = String(raw.phone ?? "").trim().replace(/\s+/g, "");
  if (!full_name) throw new Error("Vui lòng nhập họ tên");
  if (!/^0\d{9,10}$/.test(phone)) throw new Error("SĐT không hợp lệ (VD: 09xxxxxxxx)");
  return {
    full_name,
    phone,
    email: raw.email ? String(raw.email).trim() : null,
    dob: raw.dob ? String(raw.dob) : null,
    gender: raw.gender ? String(raw.gender) : null,
    source: raw.source ? String(raw.source).trim() : null,
    status: raw.status ? String(raw.status).trim() : "Đang chăm sóc",
    notes: raw.notes ? String(raw.notes).trim() : null,
  };
}

export const createCustomerWithAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validateCustomer)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Chỉ admin/manager/staff mới được tạo khách
    const [{ data: isAdmin }, { data: isManager }, { data: isStaff }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "manager" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "staff" }),
    ]);
    if (!isAdmin && !isManager && !isStaff) {
      throw new Error("Bạn không có quyền tạo khách hàng");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const virtualEmail = `${data.phone}@khach.vitath.pro`;
    const password = data.phone; // mật khẩu = SĐT theo yêu cầu

    // 1) Kiểm tra khách trùng SĐT
    const { data: existing } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("phone", data.phone)
      .maybeSingle();
    if (existing) throw new Error("SĐT này đã tồn tại trong danh sách khách hàng");

    // 2) Tạo Auth user (bypass session của admin hiện tại)
    let newUserId: string | null = null;
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: virtualEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone },
    });

    if (createErr) {
      // Nếu user đã tồn tại (VD: khách từng tự đăng ký) — lấy id qua listUsers
      const msg = (createErr.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const found = list?.users.find((u) => u.email?.toLowerCase() === virtualEmail);
        if (found) newUserId = found.id;
      }
      if (!newUserId) throw new Error(createErr.message);
    } else {
      newUserId = created?.user?.id ?? null;
    }

    if (!newUserId) throw new Error("Không tạo được tài khoản khách");

    // 3) Upsert bảng users (role = customer)
    await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: newUserId,
          email: virtualEmail,
          full_name: data.full_name,
          role: "customer",
        },
        { onConflict: "id" },
      );

    // 4) Upsert bảng customers (id = auth id)
    const { data: customerRow, error: custErr } = await supabaseAdmin
      .from("customers")
      .upsert(
        {
          id: newUserId,
          email: virtualEmail,
          phone: data.phone,
          name: data.full_name,
          full_name: data.full_name,
          dob: data.dob,
          gender: data.gender,
          source: data.source,
          status: data.status,
          notes: data.notes,
          note: data.notes,
        },
        { onConflict: "id" },
      )
      .select()
      .single();
    if (custErr) throw new Error(custErr.message);

    return { id: newUserId, customer: customerRow };
  });
