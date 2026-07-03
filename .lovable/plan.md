
# Plan — Trang Dashboard "Theo dõi tiến độ & Đặc tả dự án VitaTH Pro"

## 1. Phạm vi & mục tiêu

Tạo **1 trang public duy nhất** tại `/project-status` (route mới, không đụng bất cứ file hiện có nào ngoài việc thêm route + component). Trang trình bày dashboard tài liệu 6 tab theo phong cách **Luxury** đồng bộ brand (xanh `#1B9606`, vàng `#c9a24b`, nền trắng, font hiện có), lấy dữ liệu tiến độ **thật** từ codebase VitaTH Pro chứ không dùng số liệu trên ảnh mẫu.

Không migration, không sửa DB, không sửa Header/Footer/route khác. Không sửa file `chinhsachcongdong_vita.docx` — chỉ trích xuất nội dung để đưa vào tab Business Rules.

## 2. Đánh giá tiến độ hiện tại (nguồn dữ liệu cho dashboard)

Suy ra từ codebase (routes, tables, components đã có):

| Khối | Tiến độ | Căn cứ |
|---|---|---|
| Database core | 🟢 ~95% | 35 bảng đã tồn tại: `customers`, `orders`, `order_items`, `services`, `treatments`, `bookings`, `commissions`, `affiliate_configs`, `bonus_tiers`, `vouchers`, `voucher_conditions`, `voucher_customers`, `stores`, `shifts`, `shift_registrations`, `staff_shifts`, `attendances`, `salary_configs`, `news`, `events`, `event_registrations`, `event_media`, `banners`, `tours`, `contacts`, `notifications`, `users`, `user_roles`, `role_definitions`, `navigation_items`, `system_settings`, `referral_clicks`, `news_comments`, `shift_approval_requests`, `news_comment_contacts` |
| Website public (10 trang) | 🟢 ~90% | `_public.*` routes đầy đủ: index, about (+3 child), services, products (+5), events (+detail), community, news (+4), contact, lookup, booking |
| App khách hàng | 🟡 ~70% | `app.index`, `app.events`, `app.news`, `app.notifications`, `app.scan`, `app.store` (+checkout, +$productId), `app.account` |
| Admin CMS | 🟡 ~75% | 20 route admin: products, services, catalog, orders, bookings, customers, employees, shifts, treatments, tours, vouchers, banners, news, events, commissions, stores, navigation, settings, index, $page |
| Staff Portal | 🟡 ~60% | portal.dashboard, timesheet, bookings, contacts, content, my-treatments, affiliate |
| Auth (Supabase + Zalo) | 🟢 ~85% | `AuthContext`, Zalo OAuth server fn, `user_roles` + `has_role()`, login/dang-ky routes |
| Policy Engine (L1–L5, pool quỹ, affiliate đa điểm) | 🟠 ~35% | Có `affiliate_configs` (1 tỷ lệ % duy nhất qua trigger `affiliate_generate_commission`), `bonus_tiers`, `customers.ref_code`/`referred_by`. **Thiếu**: hạng L1–L5, ma trận % theo hạng, 3 loại Quỹ HST (địa phương/miền/toàn quốc), vai trò địa phương (GD toàn quốc/miền/tỉnh/xã), policy versioning DRAFT→ACTIVE |
| Integrations | 🟡 ~60% | Zalo login xong, Lovable AI có key, storage 3 bucket (product-images/store-images/avatars). Thiếu ZaloPay/VietQR webhook |

**Tổng thể ~72%** — đủ tiền đề dựng dashboard "đang chạy nước rút go-live".

## 3. Cấu trúc trang `/project-status`

File mới:
- `src/routes/_public.project-status.tsx` — route + `head()` SEO riêng ("Theo dõi tiến độ dự án — VitaTH Pro"), kế thừa `PublicHeader` từ `_public` layout.
- `src/components/project-status/*` — 8 sub-component (Header card, TabsNav, và 6 TabPanel) để giữ file route gọn.
- `src/lib/project-status/data.ts` — toàn bộ dữ liệu (constants) để tách nội dung khỏi UI, dễ chỉnh về sau.

Layout tổng thể (theo phong cách Luxury app):

```
┌────────────────────────────────────────────────────────┐
│  HEADER CARD (rounded-2xl, border vàng nhạt)           │
│  Logo VITA · BATCH 04 · 03/07/2026 · ● BUILD SPRINT    │
│  "Theo dõi tiến độ triển khai VitaTH Pro"              │
│  Meta: team, mốc thời gian, progress bar 72%           │
│  Chip: Hoàn thành 24 · Đang làm 11 · Chờ 6 · Chưa 3    │
└────────────────────────────────────────────────────────┘
      [Timeline] [BRD] [SRS] [UI/UX] [API] [Database] [Business Rules]
             (pill tabs, active = xanh #1B9606)
┌────────────────────────────────────────────────────────┐
│  <Tab panel content>                                   │
└────────────────────────────────────────────────────────┘
```

Có tab **Timeline** làm mặc định (roadmap milestones) + 6 tab theo yêu cầu.

## 4. Nội dung 6 tab (tóm tắt — chi tiết trong `data.ts`)

### TAB 1 · BRD
1. Bối cảnh: nâng cấp từ nền tảng Spa legacy sang VitaTH Pro (web bán hàng + app khách hàng + CMS admin + portal nhân viên + policy engine cộng đồng).
2. Stakeholders (6 vai trò): SYSTEM_ADMIN, CMS_OPERATOR, FINANCE, MANAGER cửa hàng, STAFF/kỹ thuật viên, CUSTOMER (+ Partner giới thiệu) — bảng nhu cầu × kênh.
3. Scope 8 module × trạng thái (🟢/🟡/🟠/🔴) — bản đồ với bảng ở §2.
4. User stories: 4 nhóm (Admin, Manager cửa hàng, KTV, Khách hàng/Partner).
5. KPI go-live: 100% booking online → paid, ≥80% khách app dùng ref-code, webhook ZaloPay 0 double-credit, publish policy < 5 phút.
6. Rủi ro & Giảm thiểu (5 mục): sai tỷ lệ hoa hồng, ZaloPay chưa go-live, migration khách legacy, spam ref-link, RLS thủng dữ liệu.

### TAB 2 · SRS
1. Kiến trúc: TanStack Start (React 19 + Vite 7 trên Cloudflare Workers) + Supabase Postgres 15 + RLS + Storage + Lovable AI Gateway + Zalo OAuth.
2. Bảng 10 module: Auth/Identity, Booking, Treatments, Store/Commerce, Affiliate/Commission, Policy Engine, Shifts/Payroll, CMS Content, Notifications, Admin Dashboard — mỗi module có trách nhiệm & đầu ra chính, trạng thái.
3. RBAC 5 role (admin/manager/staff/partner/customer) × 8 vùng chức năng — ma trận Full/Read/None.

### TAB 3 · UI/UX
1. Design tokens: primary `#1B9606`, gold `#c9a24b`, text `#484848`, bg `#FAFAFA`, radius 0.75rem, font Inter/hệ thống, spacing 4px scale.
2. Component standards: shadcn + Tailwind v4, luxury button (bo tròn full, border vàng), OmniSearch pill, admin DataTable dùng chung.
3. Responsive: breakpoint 768/1024/1280, mobile drawer thay sidebar, table→card <768.
4. Trạng thái UI: Loading (skeleton), Empty (illustration + CTA), Error (toast + inline), Success (toast + refetch).

### TAB 4 · API
1. Kiến trúc: `createServerFn` cho app-internal + Server Routes (`/api/public/*`) cho webhook Zalo/ZaloPay/pg_cron + Supabase Data API (RLS).
2. Bảng 8 endpoint quan trọng: `POST /api/public/zalo.authorize`, `POST /api/public/lookup-treatments`, `GET /api/public/ref.click`, server fn `createBooking`, `redeemVoucher`, `getMyTreatments`, `adminUpsertProduct`, `finalizeCommission` — kèm trạng thái tích hợp.
3. Response envelope chuẩn (`{ ok, data, error }`), error codes (POLICY_*, AUTH_*), rules Zod validation, RLS as-user vs service_role.

### TAB 5 · DATABASE
1. ERD text-tree 4 domain (Identity, Commerce, Affiliate/Policy, Content):

```
auth.users ──1─ users ──1─ user_roles
                └─ customers ──*─ orders ──*─ order_items
                              └─ bookings   └─ treatments
                              └─ referred_by ↺ (self)
stores ──*─ staff_shifts ──*─ attendances
services ──*─ order_items
affiliate_configs · bonus_tiers · commissions
vouchers ──*─ voucher_conditions
           └─*─ voucher_customers
news · events · banners · navigation_items · system_settings
```

2. Bảng phân nhóm 35 bảng đã có × ghi chú khóa/quan hệ chính.
3. Indexes & constraints trọng yếu: `orders.order_code` unique/ngày, `customers.ref_code` unique, `user_roles(user_id,role)` unique, trigger `generate_order_code`, `generate_treatments_on_paid`, `affiliate_generate_commission`, `customers_assign_ref_code`.

### TAB 6 · BUSINESS RULES — Áp dụng `chinhsachcongdong_vita.docx`
Ánh xạ từng chương chính sách → tình trạng thực trong hệ thống:

1. **Hạng L1–L5** (bảng phí thẻ, hoàn điểm 10/20/30/40/50%): 🟠 chưa có schema `member_tier` — bảng `bonus_tiers` mới là khung, cần bổ sung `tier_level`, `monthly_fee`, `cashback_percent`.
2. **Ma trận hoa hồng affiliate đa vai trò** (Affiliate SP / Kết nối MUA / Kết nối cửa hàng / Trị bán / Quỹ HST theo L1–L5): 🟠 hiện chỉ có 1 tỷ lệ đơn (trigger `affiliate_generate_commission`). Cần bổ sung `commission_matrix` versioning.
3. **Quỹ phát triển 1/2/3** (40% / 30% / 20%) & Quỹ HST toàn quốc/địa phương: 🔴 chưa có.
4. **Vai trò địa phương** (GD toàn quốc/miền/tỉnh/xã — 1/10/34/3220 vị trí): 🔴 chưa có `management_positions`.
5. **Quy tắc F0 & gán quê hương**: 🟠 có `customers.referred_by` + trigger `customers_assign_ref_code`, chưa có province/ward tree.
6. **Ví thành viên/quản lý/cửa hàng**: 🟠 có `orders.total_amount`, thiếu `wallets`/`wallet_transactions`.
7. **Chống gian lận & xử lý**: 🟠 có `referral_clicks`, `shift_approval_requests`, chưa có rule engine treo ví.
8. **Vòng đời chính sách DRAFT→ACTIVE→ARCHIVED**: 🔴 chưa có `policy_versions`.

Bảng cuối tab: **Roadmap ưu tiên** để đưa policy engine lên 100% trước go-live (5 sprint đề xuất).

## 5. Chi tiết kỹ thuật

- Route file: `src/routes/_public.project-status.tsx`, export `Route = createFileRoute("/_public/project-status")({ head, component: ProjectStatusPage })`.
- `head()` set title + meta + og:title/og:description (không og:image).
- Tabs = shadcn `Tabs` (đã có). Mặc định tab `timeline`. URL không đồng bộ (đơn giản).
- Toàn bộ dữ liệu là **static TS constants** — không fetch DB (dashboard là snapshot tài liệu).
- Bảng dùng shadcn `Table`; status badge dùng shadcn `Badge` với 4 màu (🟢 emerald / 🟡 amber / 🟠 orange / 🔴 red) — helper `<StatusBadge status="done|doing|pending|todo" />`.
- ERD dùng `<pre>` với `font-mono text-xs` + border rounded card vàng nhạt.
- Không thêm dependency mới, không migration, không sửa `chinhsachcongdong_vita.docx`.
- Kiểm tra: `tsgo` pass, mở `/project-status` render đủ 7 tab, không lỗi console.

## 6. Files sẽ thay đổi

**Tạo mới (4):**
- `src/routes/_public.project-status.tsx`
- `src/components/project-status/DashboardHeader.tsx`
- `src/components/project-status/TabPanels.tsx` (chứa 7 panel)
- `src/lib/project-status/data.ts`

**Không sửa:** bất kỳ file hiện có nào (Header, Footer, routes khác, DB, docx).

Duyệt plan để tôi build.
