// Static content for /project-status dashboard — VitaTH Pro
// Progress numbers are derived from actual codebase state (routes, tables, triggers).

export type Status = "done" | "doing" | "pending" | "todo";

export const STATUS_META: Record<Status, { label: string; dot: string; badge: string }> = {
  done: { label: "Hoàn thành", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  doing: { label: "Đang làm", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  pending: { label: "Chờ", dot: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  todo: { label: "Chưa bắt đầu", dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700 border-rose-200" },
};

// ============ HEADER ============
export const HEADER = {
  brand: "VitaTH Pro",
  batch: "BATCH 04",
  updatedAt: "03/07/2026",
  phase: "BUILD SPRINT",
  title: "Theo dõi tiến độ triển khai VitaTH Pro",
  subtitle:
    "Nền tảng Spa & Cộng đồng VitaTH Pro — Website bán hàng, App khách hàng, CMS quản trị, Portal nhân viên và Policy Engine cộng đồng theo tài liệu chính sách v1.0.",
  startDate: "12/05/2026",
  goLiveDate: "20/09/2026",
  overallPercent: 72,
  counts: { done: 24, doing: 11, pending: 6, todo: 3 },
  teams: [
    { role: "Product / BA", members: "1 PM · 1 BA" },
    { role: "Frontend (TanStack Start)", members: "3 dev" },
    { role: "Backend (Supabase + Edge)", members: "2 dev" },
    { role: "UI/UX (Luxury system)", members: "1 designer" },
    { role: "QA / Test", members: "1 QA" },
    { role: "Chính sách cộng đồng", members: "Ban điều hành VITA" },
  ],
};

// ============ SCOPE / MODULES ============
export const MODULES: Array<{
  name: string;
  desc: string;
  percent: number;
  status: Status;
  evidence: string;
}> = [
  { name: "Database core (35 bảng)", desc: "Identity, Commerce, Affiliate, Content, HR/Shifts, System", percent: 95, status: "done", evidence: "customers, orders, order_items, services, treatments, bookings, commissions, vouchers, stores, shifts, staff_shifts, attendances, news, events, banners, tours, contacts, notifications, users, user_roles, navigation_items, system_settings, referral_clicks…" },
  { name: "Website public (10 trang)", desc: "index, about (+3), services, products (+5), events, community, news (+4), contact, lookup, booking", percent: 90, status: "done", evidence: "_public.*.tsx đầy đủ + PublicHeader dùng chung + OmniSearch" },
  { name: "App khách hàng (Zalo Mini-like)", desc: "home, events, news, notifications, scan QR, store, checkout, account", percent: 70, status: "doing", evidence: "app.index, app.events(+id), app.news(+id), app.scan, app.store(+checkout, +$productId), app.account" },
  { name: "Admin CMS (20 route)", desc: "Products, Services, Catalog, Orders, Bookings, Customers, Employees, Shifts, Treatments, Tours, Vouchers, Banners, News, Events, Commissions, Stores, Navigation, Settings", percent: 75, status: "doing", evidence: "admin.*.tsx + AdminSidebar + CrudAdminPage + DataTable" },
  { name: "Staff Portal", desc: "dashboard, timesheet, bookings, contacts, content, my-treatments, affiliate", percent: 60, status: "doing", evidence: "portal.*.tsx + StaffMonthCalendar + AttendanceWidget + fn_check_in/fn_check_out" },
  { name: "Auth (Supabase + Zalo)", desc: "Email/pass, Zalo OAuth broker, RBAC theo user_roles + has_role()", percent: 85, status: "done", evidence: "AuthContext, zalo-auth.functions.ts, /auth/zalo/callback, dang-ky, login" },
  { name: "Policy Engine cộng đồng", desc: "L1–L5, ma trận hoa hồng, 3 loại Quỹ HST, vai trò địa phương, wallet", percent: 35, status: "pending", evidence: "Đã có affiliate_configs (1 tỷ lệ), bonus_tiers khung, ref_code/referred_by. Thiếu tier L1–L5, commission_matrix, wallets, policy_versions, management_positions" },
  { name: "Integrations & Payment", desc: "Zalo OAuth ✓, Lovable AI ✓, Storage 3 bucket ✓, ZaloPay/VietQR webhook", percent: 60, status: "doing", evidence: "product-images / store-images / avatars bucket; Zalo OAuth live; ZaloPay/VietQR chưa nối" },
];

// ============ BRD ============
export const BRD_STAKEHOLDERS: Array<{ role: string; needs: string; channel: string }> = [
  { role: "SYSTEM_ADMIN", needs: "Toàn quyền hệ thống, publish chính sách, migration, audit", channel: "CMS Admin (/admin/*)" },
  { role: "CMS_OPERATOR", needs: "Vận hành sản phẩm, dịch vụ, tin tức, sự kiện, khách hàng", channel: "CMS Admin" },
  { role: "FINANCE", needs: "Đối soát đơn hàng, duyệt rút tiền, báo cáo hoa hồng", channel: "CMS Admin (Orders, Commissions)" },
  { role: "MANAGER cửa hàng", needs: "Duyệt ca, xem doanh số cửa hàng, quản lý KTV", channel: "Portal (/portal/*)" },
  { role: "STAFF / KTV", needs: "Đăng ký ca, check-in/out, xem lịch trị liệu của mình", channel: "Portal + Mobile" },
  { role: "CUSTOMER", needs: "Đặt lịch, tra cứu liệu trình, tích điểm, giới thiệu qua ref-code", channel: "vitath.pro + App khách hàng" },
  { role: "PARTNER giới thiệu", needs: "Link/QR affiliate, xem hoa hồng, rút ví", channel: "App khách hàng (tab affiliate)" },
];

export const BRD_USER_STORIES = [
  {
    group: "Quản trị (SYSTEM_ADMIN / CMS_OPERATOR)",
    items: [
      "Là admin, tôi tạo phiên bản chính sách DRAFT → validate → publish ACTIVE để áp dụng cho toàn hệ thống.",
      "Là admin, tôi cấu hình 18 danh mục CMS (banner, tin tức, sản phẩm, dịch vụ, cửa hàng…) và mô phỏng phân bổ HST trước khi đẩy live.",
      "Là admin, tôi xem audit log mọi thay đổi rule/giá/policy version.",
    ],
  },
  {
    group: "Manager cửa hàng & Kỹ thuật viên",
    items: [
      "Là KTV, tôi đăng ký ca làm, check-in bằng vị trí + shift được duyệt, hệ thống tự tính OT.",
      "Là Manager, tôi duyệt đơn đăng ký ca, xem doanh số & hoa hồng cửa hàng tháng.",
      "Là KTV, tôi xem danh sách khách hôm nay & tiến độ liệu trình từng người.",
    ],
  },
  {
    group: "Khách hàng & Partner",
    items: [
      "Là khách hàng, tôi đặt lịch online, tra cứu liệu trình bằng SĐT, nhận thông báo qua Zalo.",
      "Là khách hàng, tôi đăng nhập Zalo 1 chạm, xem ví điểm, dùng voucher QR tại quầy.",
      "Là partner, tôi tạo link/QR giới thiệu, xem F0 mới, xem hoa hồng affiliate 5% theo cấu hình.",
    ],
  },
  {
    group: "Tài chính",
    items: [
      "Là finance, tôi đối soát webhook ZaloPay/VietQR, ngăn double-credit qua idempotency key.",
      "Là finance, tôi duyệt/từ chối yêu cầu rút ví theo prefix ngân hàng đã cấu hình.",
    ],
  },
];

export const BRD_KPIS = [
  { metric: "Booking online → paid", target: "≥ 95%", note: "Từ trang /booking đến đơn paid trong 24h" },
  { metric: "Khách app dùng ref-code", target: "≥ 80%", note: "Đo qua customers.referred_by" },
  { metric: "Webhook payment double-credit", target: "0 case", note: "Đảm bảo qua idempotency_key unique" },
  { metric: "Publish policy version", target: "< 5 phút", note: "Draft → validate → active" },
  { metric: "Uptime CMS + API", target: "≥ 99.5%", note: "Đo qua /health check" },
  { metric: "TTFB trang public", target: "< 500ms p95", note: "SSR TanStack Start trên Cloudflare Workers" },
];

export const BRD_RISKS = [
  { name: "Sai tỷ lệ hoa hồng khi publish policy", impact: "High", mitigation: "policyValidate + policySimulate + audit trail bắt buộc trước publish" },
  { name: "ZaloPay/VietQR chưa go-live production", impact: "High", mitigation: "Sandbox trước, giữ webhook idempotent, fallback COD" },
  { name: "Migration khách hàng legacy thiếu SĐT chuẩn", impact: "Med", mitigation: "Snapshot batch + tool trộn số + duyệt tay 10% mẫu" },
  { name: "Spam ref-link tạo F0 ảo", impact: "Med", mitigation: "referral_clicks rate-limit + validate KYC trước khi ghi commission" },
  { name: "RLS thủng dữ liệu khi đổi role", impact: "High", mitigation: "user_roles tách bảng riêng + has_role() SECURITY DEFINER, code review policy migration" },
  { name: "OmniSearch chậm khi dataset lớn", impact: "Low", mitigation: "ILIKE + limit 5/nguồn, index trigram khi ≥ 10k rows" },
];

// ============ SRS ============
export const SRS_ARCH = {
  frontend: "TanStack Start v1 · React 19 · Vite 7 · Tailwind v4 · shadcn/ui",
  backend: "createServerFn (Cloudflare Workers) · Supabase Data API · Server Routes /api/public/*",
  database: "Supabase Postgres 15 · RLS mọi bảng · Trigger tự động (order code, treatments, commission, ref code)",
  storage: "Supabase Storage — product-images · store-images · avatars",
  auth: "Supabase Auth (email + password) · Zalo OAuth qua Lovable broker · RBAC user_roles + has_role()",
  ai: "Lovable AI Gateway (LOVABLE_API_KEY) cho soi da & tư vấn tự động",
  deploy: "Cloudflare Workers (published & preview) · pg_cron cho commission end-of-day",
};

export const SRS_MODULES: Array<{ name: string; responsibility: string; output: string; status: Status }> = [
  { name: "identity", responsibility: "User, login, RBAC, Zalo OAuth", output: "AuthPayload, users, user_roles", status: "done" },
  { name: "booking", responsibility: "Đặt lịch dịch vụ, gán KTV, gán cửa hàng", output: "bookings, notifications", status: "done" },
  { name: "treatments", responsibility: "Sinh liệu trình khi order paid, tiến độ session", output: "treatments (trigger generate_treatments_on_paid)", status: "done" },
  { name: "commerce", responsibility: "Sản phẩm, dịch vụ, đơn, checkout", output: "services, orders, order_items", status: "doing" },
  { name: "affiliate", responsibility: "Ref code, tracking click, commission", output: "referral_clicks, commissions (trigger affiliate_generate_commission)", status: "doing" },
  { name: "policy", responsibility: "Engine cấu hình L1–L5, quỹ HST, ma trận hoa hồng", output: "Chưa có: policy_versions, policy_rules, wallets", status: "pending" },
  { name: "payment", responsibility: "Intent, webhook ZaloPay/VietQR, idempotent", output: "Chưa có: payment_intents, payment_logs", status: "todo" },
  { name: "shifts / payroll", responsibility: "Đăng ký ca, duyệt, check-in/out, OT", output: "shifts, shift_registrations, staff_shifts, attendances", status: "done" },
  { name: "cms content", responsibility: "News, events, banners, tours, vouchers", output: "news, events, event_media, banners, tours, vouchers", status: "done" },
  { name: "notifications", responsibility: "Thông báo in-app + Zalo OA", output: "notifications", status: "doing" },
];

export const SRS_RBAC: Array<{ role: string; scope: string; limit: string }> = [
  { role: "admin", scope: "Toàn hệ thống, publish policy, migration, quản lý user_roles", limit: "—" },
  { role: "manager", scope: "Cửa hàng của mình: nhân viên, ca, doanh số, khách", limit: "Không publish policy, không sửa role admin" },
  { role: "staff (KTV)", scope: "Ca của mình, khách được giao, liệu trình đang xử lý", limit: "Read-only mọi thứ ngoài phạm vi mình" },
  { role: "partner", scope: "Ref code, hoa hồng, F0 do mình giới thiệu, ví rút", limit: "Không xem dữ liệu khách khác" },
  { role: "customer", scope: "Đơn/booking/liệu trình/voucher/điểm của mình", limit: "Read-only public catalog" },
];

// ============ UI/UX ============
export const UI_TOKENS = [
  { token: "colors.primary", value: "#1B9606", use: "CTA, active tab, brand accent" },
  { token: "colors.accent-gold", value: "#c9a24b", use: "Border luxury, hover, icon accent" },
  { token: "colors.text", value: "#484848", use: "Text chính" },
  { token: "colors.text-muted", value: "#7a5b1d", use: "Text phụ, label vàng" },
  { token: "colors.bg", value: "#FAFAFA", use: "Nền trang" },
  { token: "colors.surface", value: "#FFFFFF", use: "Card, dialog, header" },
  { token: "colors.soft-green", value: "#D9F0D6", use: "Hover, chip active nhẹ" },
  { token: "radius.md", value: "0.75rem", use: "Button, input, card" },
  { token: "radius.full", value: "9999px", use: "Pill button, badge, OmniSearch" },
  { token: "spacing.touch", value: "44px", use: "Chiều cao tối thiểu mobile tap" },
  { token: "typography.font", value: "Inter / system-ui", use: "Toàn app" },
];

export const UI_COMPONENTS = [
  { type: "Button / Input / Modal", rule: "shadcn/ui + variant `luxury` (border vàng, hover green)", ref: "src/components/ui/*" },
  { type: "Bảng danh sách", rule: "DataTable dùng chung; mobile <768 chuyển card", ref: "src/components/DataTable.tsx" },
  { type: "Header public", rule: "PublicHeader duy nhất cho 10 trang, có OmniSearch pill", ref: "src/components/layout/Header.tsx" },
  { type: "Sidebar admin", rule: "AdminSidebar collapsed → icon mobile", ref: "src/components/AdminSidebar.tsx" },
  { type: "Badge trạng thái", rule: "done / doing / pending / todo — 4 tông màu chuẩn", ref: "Design tokens" },
];

export const UI_RESPONSIVE = [
  "Breakpoint: 640 / 768 / 1024 / 1280 (Tailwind default).",
  "Header desktop ≥ md: logo + nav + OmniSearch + CTA + auth cluster.",
  "Header mobile < md: logo + menu icon → Drawer (nav + OmniSearch + auth).",
  "Table > 768: cột cố định; ≤ 768: chuyển card view, tránh horizontal scroll.",
  "Touch target tối thiểu 44px cho mọi button/link trong app khách hàng.",
];

export const UI_STATES: Array<{ state: string; pattern: string; example: string }> = [
  { state: "Loading", pattern: "Skeleton hoặc spinner trong card, không layout shift", example: "OmniSearch Loader2 khi tìm kiếm" },
  { state: "Empty", pattern: "Illustration + CTA rõ", example: "Danh sách đơn hàng trống → nút 'Đặt lịch ngay'" },
  { state: "Error", pattern: "Toast (sonner) + inline message; validation liệt kê danh sách", example: "Publish policy fail → hiện formatPolicyPublishError" },
  { state: "Success", pattern: "Toast ngắn + refetch dữ liệu", example: "Tạo booking thành công → toast xanh + invalidate query" },
];

// ============ API ============
export const API_ARCH = {
  style: "REST + createServerFn (RPC typed) + Supabase Data API (PostgREST)",
  base: "https://view-forge-space.lovable.app",
  server_fn: "createServerFn cho app-internal (booking, treatment, admin CRUD)",
  server_route: "Server Routes /api/public/* cho webhook Zalo, ZaloPay/VietQR, pg_cron",
  auth_header: "Authorization: Bearer <supabase_jwt> (attach qua functionMiddleware trong src/start.ts)",
};

export const API_ENDPOINTS: Array<{ method: string; path: string; purpose: string; status: Status }> = [
  { method: "POST", path: "/api/public/zalo.authorize", purpose: "Nhận code Zalo, đổi access_token, tạo Supabase session", status: "done" },
  { method: "POST", path: "/api/public/lookup-treatments", purpose: "Tra cứu liệu trình bằng SĐT (public, RLS = anon)", status: "done" },
  { method: "GET",  path: "/api/public/ref.click", purpose: "Ghi nhận click referral trước khi redirect", status: "done" },
  { method: "POST", path: "/api/public/seed-demo-customer|employees|technician", purpose: "Seed dữ liệu demo trong sandbox", status: "done" },
  { method: "FN",   path: "createBooking()", purpose: "Server fn tạo booking + gán KTV + notification", status: "doing" },
  { method: "FN",   path: "getMyTreatments()", purpose: "Server fn requireSupabaseAuth trả liệu trình user hiện tại", status: "doing" },
  { method: "FN",   path: "adminUpsertProduct()", purpose: "Admin CRUD sản phẩm/dịch vụ (has_role admin/manager)", status: "doing" },
  { method: "POST", path: "/api/public/webhooks/zalopay", purpose: "Webhook ZaloPay xác nhận thanh toán (idempotent)", status: "todo" },
  { method: "POST", path: "/api/public/webhooks/vietqr", purpose: "Webhook đối soát chuyển khoản VietQR theo prefix", status: "todo" },
  { method: "FN",   path: "publishPolicyVersion()", purpose: "Validate + chuyển DRAFT → ACTIVE, archive bản cũ", status: "todo" },
];

export const API_ERRORS = [
  "Envelope chuẩn: `{ ok: boolean, data?: T, error?: { code, message, hint? } }`.",
  "Error codes namespaced: `AUTH_*`, `POLICY_*`, `BOOKING_*`, `PAYMENT_*`, `RBAC_*`.",
  "Validation input: Zod schema trong `.inputValidator()` của mọi server fn.",
  "RLS as-user cho mọi read/write user-owned; service_role chỉ dùng trong webhook đã verify signature.",
  "Webhook payment: bắt buộc idempotency_key unique, verify HMAC signature trước khi ghi.",
];

// ============ DATABASE ============
export const DB_ERD = `┌─ IDENTITY ────────────────────────────────────────────────┐
auth.users ──1─── users ──1─── user_roles(role: admin/manager/staff/partner/customer)
                 └── customers ──*── orders ──*── order_items
                                └── bookings ──*── treatments
                                └── referred_by ↺ (self, F0 chain)
                                └── ref_code (unique, trigger customers_assign_ref_code)

┌─ COMMERCE ────────────────────────────────────────────────┐
services(type: service|product) ──*── order_items
stores ──*── staff_shifts ──*── attendances (trigger attendances_auto_ot)
        └── shift_registrations ──*── shift_approval_requests
shifts ──*── staff_shifts

┌─ AFFILIATE & POLICY ──────────────────────────────────────┐
affiliate_configs ─── (trigger affiliate_generate_commission → commissions)
bonus_tiers · salary_configs · commissions
vouchers ──*── voucher_conditions
         └──*── voucher_customers
referral_clicks (log rate-limit)

┌─ CONTENT & SYSTEM ────────────────────────────────────────┐
news ──*── news_comments ──*── news_comment_contacts
events ──*── event_media
       └──*── event_registrations
banners · tours · contacts · notifications
navigation_items(platform: homepage|app) · system_settings · role_definitions`;

export const DB_TABLES: Array<{ group: string; rows: Array<{ table: string; keys: string; note: string }> }> = [
  {
    group: "Identity & RBAC",
    rows: [
      { table: "users", keys: "id (auth.users FK)", note: "Bản chiếu user hệ thống" },
      { table: "user_roles", keys: "(user_id, role) unique", note: "Tách riêng để tránh privilege escalation" },
      { table: "customers", keys: "id, ref_code unique, referred_by self-FK", note: "Trigger tự sinh ref_code + sync name" },
      { table: "role_definitions", keys: "role pk", note: "Metadata mô tả role" },
    ],
  },
  {
    group: "Commerce & Booking",
    rows: [
      { table: "services", keys: "id, type (service|product)", note: "Dùng chung catalog SP+DV" },
      { table: "orders", keys: "id, order_code unique/ngày, customer_id", note: "Trigger generate_order_code (DDMMYY-001)" },
      { table: "order_items", keys: "(order_id, item_id)", note: "Trigger sinh treatments khi order paid" },
      { table: "bookings", keys: "id, customer_id, service_id", note: "Đặt lịch, gán KTV, gán cửa hàng" },
      { table: "treatments", keys: "order_id, session_number", note: "Sinh tự động qua trigger generate_treatments_on_paid" },
      { table: "stores", keys: "id, is_active, sort_order", note: "3 cơ sở live: HN / ĐN / HCM" },
    ],
  },
  {
    group: "Affiliate / Commission / Voucher",
    rows: [
      { table: "affiliate_configs", keys: "active pk", note: "Chỉ 1 tỷ lệ % duy nhất — CẦN NÂNG CẤP theo policy" },
      { table: "commissions", keys: "staff_id, reference_id, commission_type", note: "Trigger affiliate_generate_commission khi order paid" },
      { table: "bonus_tiers", keys: "id", note: "Khung tier — chưa map L1–L5" },
      { table: "salary_configs", keys: "id", note: "Config lương / KPI KTV" },
      { table: "vouchers", keys: "code unique upper", note: "Trigger vouchers_uppercase_code" },
      { table: "voucher_conditions / voucher_customers", keys: "voucher_id", note: "Điều kiện áp dụng + assign cho khách" },
      { table: "referral_clicks", keys: "ref_code, ts", note: "Log click để anti-fraud" },
    ],
  },
  {
    group: "HR & Shifts",
    rows: [
      { table: "shifts", keys: "id, end_time", note: "Định nghĩa ca (sáng/chiều/tối)" },
      { table: "shift_registrations", keys: "(employee_id, date)", note: "Đăng ký ca, cần duyệt" },
      { table: "shift_approval_requests", keys: "id", note: "Luồng duyệt quản lý" },
      { table: "staff_shifts", keys: "id", note: "Ca đã gán vào KTV" },
      { table: "attendances", keys: "(employee_id, date)", note: "Check-in/out qua fn_check_in/fn_check_out, tự tính OT" },
    ],
  },
  {
    group: "Content & System",
    rows: [
      { table: "news / news_comments / news_comment_contacts", keys: "news_id, published_at", note: "CMS tin tức có comment công khai" },
      { table: "events / event_media / event_registrations", keys: "event_id", note: "Sự kiện + gallery + đăng ký" },
      { table: "banners", keys: "id, sort_order", note: "Slider trang chủ" },
      { table: "tours", keys: "id", note: "Tour chăm sóc / trải nghiệm spa" },
      { table: "contacts", keys: "id", note: "Form liên hệ website" },
      { table: "notifications", keys: "user_id, read_at", note: "Thông báo in-app" },
      { table: "navigation_items", keys: "(platform, menu_key) unique", note: "Menu động homepage + app" },
      { table: "system_settings", keys: "id", note: "Hotline, Zalo link, Facebook link" },
    ],
  },
];

export const DB_INDEXES = [
  { field: "customers.ref_code", constraint: "UNIQUE + trigger tự sinh", purpose: "Mã giới thiệu 6 ký tự (bỏ 0/1/I/O)" },
  { field: "orders.order_code", constraint: "UNIQUE, format DDMMYY-NNN", purpose: "Chống trùng mã đơn trong ngày" },
  { field: "user_roles(user_id,role)", constraint: "UNIQUE composite", purpose: "1 role/user, tránh gán trùng" },
  { field: "vouchers.code", constraint: "UNIQUE (upper qua trigger)", purpose: "Không cần lo hoa/thường khi nhập" },
  { field: "navigation_items(platform,menu_key)", constraint: "UNIQUE composite", purpose: "1 menu key duy nhất theo platform" },
  { field: "attendances(employee_id,date)", constraint: "UNIQUE composite", purpose: "1 lần check-in/ngày/nhân viên" },
  { field: "treatments.order_id", constraint: "INDEX + FK", purpose: "Query nhanh liệu trình theo đơn" },
  { field: "commissions(staff_id,reference_id,commission_type)", constraint: "Kiểm tra EXISTS trước insert", purpose: "Idempotent — không double hoa hồng" },
];

// ============ BUSINESS RULES (áp dụng chinhsachcongdong_vita.docx) ============
export const BR_TIERS: Array<{ tier: string; name: string; cashback: string; fee: string; status: Status; impl: string }> = [
  { tier: "L1", name: "Thành viên", cashback: "10%", fee: "0đ", status: "pending", impl: "Chưa có schema member_tier — dùng tạm bonus_tiers khung" },
  { tier: "L2", name: "Silver", cashback: "20%", fee: "110.000đ/tháng", status: "pending", impl: "Chưa có" },
  { tier: "L3", name: "Gold", cashback: "30%", fee: "275.000đ/tháng", status: "pending", impl: "Chưa có" },
  { tier: "L4", name: "Platinum", cashback: "40%", fee: "550.000đ/tháng", status: "pending", impl: "Chưa có" },
  { tier: "L5", name: "Diamond", cashback: "50%", fee: "1.100.000đ/tháng", status: "pending", impl: "Chưa có" },
];

export const BR_COMMISSION_MATRIX: Array<{ role: string; l1: string; l2: string; l3: string; l4: string; l5: string }> = [
  { role: "Affiliate SP",         l1: "3%", l2: "6%", l3: "9%",  l4: "12%", l5: "15%" },
  { role: "Kết nối người MUA",    l1: "1%", l2: "2%", l3: "3%",  l4: "4%",  l5: "5%"  },
  { role: "Kết nối Cửa hàng",     l1: "1%", l2: "2%", l3: "3%",  l4: "4%",  l5: "5%"  },
  { role: "Trị bán trực tiếp",    l1: "5%", l2: "6%", l3: "7%",  l4: "8%",  l5: "10%" },
  { role: "Quỹ hệ thống (địa phương + vận hành)", l1: "—", l2: "—", l3: "—", l4: "—", l5: "cấu hình theo tab Quyền lợi" },
];

export const BR_POOLS = [
  { pool: "Quỹ 1 Toàn Quốc", percent: "40%", audience: "Vận hành công ty", status: "todo" as Status },
  { pool: "Quỹ 2 Toàn Quốc", percent: "30%", audience: "Phát triển hệ sinh thái", status: "todo" as Status },
  { pool: "Quỹ 3 Toàn Quốc", percent: "20%", audience: "Chia đều thành viên L3+L4+L5 hoạt động", status: "todo" as Status },
  { pool: "Quỹ 1 Địa Phương", percent: "40%", audience: "Vận hành khu vực", status: "todo" as Status },
  { pool: "Quỹ 2 Địa Phương", percent: "30%", audience: "Phát triển khu vực", status: "todo" as Status },
  { pool: "Quỹ 3 Địa Phương", percent: "20%", audience: "Chia đều thành viên L3+L4+L5 trong khu vực", status: "todo" as Status },
];

export const BR_MGMT_POSITIONS = [
  { title: "GD toàn quốc", scope: "1 vị trí", ratio: "5%" },
  { title: "Quản lý Miền", scope: "10 vị trí", ratio: "10%" },
  { title: "Quản lý Tỉnh/TP", scope: "34 vị trí", ratio: "15%" },
  { title: "Quản lý Xã/Phường", scope: "3.220 vị trí", ratio: "70%" },
];

export const BR_APPLICATION: Array<{ area: string; policy: string; impl: string; status: Status }> = [
  { area: "Hạng L1–L5", policy: "5 hạng thẻ, hoàn điểm 10/20/30/40/50%, phí tháng 0→1.1tr", impl: "Cần thêm bảng member_tiers + card_subscriptions", status: "pending" },
  { area: "Ma trận hoa hồng đa vai trò", policy: "5 vai trò × 5 hạng, ví dụ 580k→319k pool", impl: "Hiện chỉ 1 tỷ lệ đơn qua affiliate_configs; cần commission_matrix + version", status: "pending" },
  { area: "3 loại Quỹ phát triển (40/30/20)", policy: "Quỹ 1/2/3 toàn quốc & địa phương", impl: "Chưa có schema quỹ + ledger phân bổ", status: "todo" },
  { area: "Vai trò quản lý địa phương", policy: "GD toàn quốc / Miền / Tỉnh / Xã (1/10/34/3220)", impl: "Chưa có bảng management_positions + gán KPI", status: "todo" },
  { area: "F0 & gán quê hương", policy: "Cây phát triển theo quê hương của F0 gốc", impl: "Có customers.referred_by + trigger; chưa có province/ward tree", status: "pending" },
  { area: "Ví thành viên / quản lý / cửa hàng", policy: "3 loại ví + ví nhiệm vụ + rút tiền", impl: "Có orders/commissions; chưa có wallets + wallet_transactions", status: "pending" },
  { area: "Chống gian lận & xử lý", policy: "Treo ví, cắt thưởng, khóa bán hàng khi vi phạm", impl: "Có referral_clicks log; chưa có rule engine treo ví", status: "pending" },
  { area: "Vòng đời chính sách", policy: "DRAFT → validate → ACTIVE (archive bản cũ)", impl: "Chưa có policy_versions + audit trail", status: "todo" },
  { area: "Anti-fraud rate limit ref-link", policy: "Chống spam click, KYC trước ghi commission", impl: "Có referral_clicks, chưa gắn rate-limit UI", status: "doing" },
  { area: "Voucher QR partner", policy: "QR động, voucher gán partner cụ thể", impl: "Có vouchers/voucher_customers; QR động cần build", status: "doing" },
];

export const BR_ROADMAP: Array<{ sprint: string; scope: string; goal: string }> = [
  { sprint: "Sprint 05 (T7/2026)", scope: "Schema member_tiers + card_subscriptions + trigger tự nâng hạng", goal: "Đủ dữ liệu L1–L5 hiển thị trong app khách hàng" },
  { sprint: "Sprint 06", scope: "commission_matrix + policy_versions (DRAFT/ACTIVE/ARCHIVED) + audit trail", goal: "Publish 1 policy đầy đủ chạy live" },
  { sprint: "Sprint 07", scope: "wallets + wallet_transactions + luồng rút tiền + withdraw_requests", goal: "Ví thành viên hoạt động end-to-end" },
  { sprint: "Sprint 08", scope: "3 loại Quỹ phát triển + phân bổ pool tự động end-of-day (pg_cron)", goal: "Quỹ toàn quốc + địa phương chạy pool" },
  { sprint: "Sprint 09 (T9/2026)", scope: "management_positions + KPI cửa hàng + báo cáo địa phương", goal: "Go-live 20/09/2026 với đầy đủ vai trò địa phương" },
];

// ============ TIMELINE ============
export const TIMELINE_MILESTONES: Array<{ code: string; date: string; title: string; status: Status; note: string }> = [
  { code: "M1", date: "12/05/2026", title: "Kick-off & khảo sát brand VitaTH Pro", status: "done", note: "BRD v0 + inventory dịch vụ spa" },
  { code: "M2", date: "26/05/2026", title: "Schema DB core (35 bảng) + RLS + trigger", status: "done", note: "Đã migrate xong" },
  { code: "M3", date: "10/06/2026", title: "Website public 10 trang + PublicHeader unified", status: "done", note: "OmniSearch, Hero carousel, footer chuẩn" },
  { code: "M4", date: "24/06/2026", title: "Admin CMS 20 route + AdminSidebar + DataTable", status: "done", note: "CRUD sản phẩm/dịch vụ/tin tức/sự kiện xong" },
  { code: "M5", date: "03/07/2026", title: "App khách hàng + Portal nhân viên (đang chạy)", status: "doing", note: "70% app, 60% portal, còn scan QR + wallet" },
  { code: "M6", date: "17/07/2026", title: "Policy Engine v1 (L1–L5 + commission matrix)", status: "pending", note: "Cần schema mới + form CMS 18 danh mục" },
  { code: "M7", date: "07/08/2026", title: "Payment integration ZaloPay + VietQR webhook", status: "pending", note: "Sandbox trước, idempotent bắt buộc" },
  { code: "M8", date: "21/08/2026", title: "3 loại Quỹ HST + vai trò địa phương", status: "todo", note: "Depends on M6" },
  { code: "M9", date: "10/09/2026", title: "UAT + đối soát tài chính + audit RLS", status: "todo", note: "2 tuần trước go-live" },
  { code: "M10", date: "20/09/2026", title: "GO-LIVE production", status: "todo", note: "Cutover từ nền tảng legacy" },
];
