# Epic Update — 4 Modules

Triển khai tuần tự theo thứ tự dưới. Không sửa các component đang chạy ngoài phạm vi đã liệt kê.

---

## MODULE 1 — Quản lý Cửa hàng (Stores)

### 1.1 Database (migration)
Tạo bảng `public.stores`:
- `id uuid pk`, `name text`, `images text[]`, `main_image text`, `address text`, `phone text`, `hotline text`, `email text`, `open_hours text`, `is_active bool default true`, `sort_order int default 0`, `created_at/updated_at`
- GRANT: `SELECT` cho `anon` + `authenticated` (public list); `INSERT/UPDATE/DELETE` cho `authenticated` (siết bằng RLS admin/manager)
- RLS: public read khi `is_active=true`; write chỉ admin/manager (dùng `has_role`)
- Trigger `updated_at`
- Storage bucket `store-images` (public) cho upload ảnh
- Seed 3 cơ sở đang hiện ở homepage (VITA Premium Hà Nội, VITA Signature Đà Nẵng, VITA Flagship TP.HCM) từ mockdata trong migration

### 1.2 Admin UI — `/admin/stores`
- Route mới `src/routes/admin.stores.tsx`, thêm sidebar link "Cửa hàng"
- Table: ảnh chính, tên, địa chỉ, hotline, trạng thái, actions
- Nút "Thêm mới" & "Chỉnh sửa" mở **Centered Modal** (Dialog) — tái sử dụng pattern từ `/admin/products` (KHÔNG Drawer)
- Form: name, address, phone, hotline, email, open_hours, images (multi upload → bucket `store-images`), chọn 1 làm main_image, toggle `is_active`
- Delete confirm

### 1.3 Client Sync
- `/app` (`src/layouts/AppLayout.tsx` hoặc component render danh sách cửa hàng): thay mockdata → `useQuery` fetch stores `is_active=true` sort theo `sort_order`
- `/app/store` (`src/routes/app.store.tsx`): Dropdown chọn cơ sở fetch từ `stores` (id + name), xoá hardcode
- Homepage section "HỆ THỐNG CƠ SỞ SPA & CLINIC" cũng fetch từ `stores` (đồng bộ 1 nguồn)

---

## MODULE 2 — Hồ sơ cá nhân (`/app/account`)

Refactor `src/routes/app.account.tsx` thành form Luxury responsive với phân quyền:

### Nhân viên/Quản lý (role staff/manager/admin)
- Sửa được: avatar, full_name, phone
- Read-only: `department` (chỉ admin cao nhất — kiểm tra `has_role('admin')` — mới sửa được)
- Hiện khu "Đổi mật khẩu"

### Khách hàng (customer, gồm login Zalo)
- Sửa được: avatar, full_name (override tên Zalo), phone, birthday, address
- **Bắt buộc** hiện khu "Đổi mật khẩu" (để đặt password thay mặc định SĐT)

### Logic
- Update vào `profiles`/`customers`/`users` tương ứng role
- Avatar upload → bucket `avatars` (tạo nếu chưa có)
- Password: `supabase.auth.updateUser({ password })`
- Toast (sonner) cho mọi trạng thái

---

## MODULE 3 — Omni Searchbar (Header homepage)

### UI (`src/components/Header.tsx`)
- Thêm ô search vào header desktop (thay/bổ sung vị trí phù hợp, responsive)
- Style Luxury: rounded-full, border mảnh, `focus-within:shadow-md`, tone gold/brown/white hài hoà với brand xanh hiện tại
- Placeholder: "Bạn đang tìm kiếm gì?"
- Dropdown Filter (shadcn Select) ở rìa trái/phải: Tất cả | Dịch vụ | Sản phẩm | Tin tức | Sự kiện
- Icon lúp bên phải
- Mobile: giữ trong drawer (đã có sẵn ô search) — mở rộng thêm filter

### Logic
- Debounced query (250ms), min 2 ký tự
- Server function `searchOmni({ q, type })`:
  - Dịch vụ/Sản phẩm → `services` ILIKE name
  - Tin tức → `news` ILIKE title
  - Sự kiện → `events` ILIKE title
  - "Tất cả" → chạy song song 4 nguồn, gộp
- Kết quả: Popover instant search ngay dưới ô search, group theo loại, click → điều hướng route detail

---

## MODULE 4 — Dynamic Navigation Menu

### 4.1 Database
Bảng `public.navigation_items`:
- `id uuid`, `platform text check in ('homepage','app')`, `menu_key text`, `label text`, `route text`, `is_visible bool default true`, `sort_order int`, `updated_at`
- Unique (`platform`, `menu_key`)
- GRANT: SELECT anon+authenticated; write chỉ admin
- RLS tương ứng
- Seed:
  - `homepage`: Trang chủ, Giới thiệu, Sản phẩm, Dịch vụ, Sự kiện, Cộng đồng, Tin tức, Liên hệ
  - `app` (Quick Access — KHÔNG bao gồm bottom nav): Soi da AI, Cửa hàng, Đặt lịch, Quét QR, Ví VITA, Ưu đãi

### 4.2 Admin — `/admin/navigation` (label sidebar: "Quản lý Trang chủ")
- 2 Tabs (shadcn Tabs): "Website PC" | "Mobile App"
- Mỗi tab: list `[Label] | [Route] | [Toggle Switch]`
- Toggle → update `is_visible` → toast
- TUYỆT ĐỐI không đụng Bottom Nav

### 4.3 Client Sync
- `src/components/Header.tsx`: fetch `platform='homepage'` `.filter(is_visible)` thay `navLinks` cứng (giữ fallback nếu fetch fail)
- `/app` Quick Access cluster (component tương ứng trong `CustomerHomeContent` hoặc `AppLayout`): fetch `platform='app'` filter render
- Bottom Nav mobile: giữ nguyên hardcode — không đọc DB

---

## Thứ tự thực thi
1. Migration M1 (stores) + M4 (navigation_items) gộp 1 migration (để user duyệt 1 lần)
2. Bucket storage `store-images` + `avatars`
3. Admin UI: `/admin/stores` → `/admin/navigation`
4. Client sync: homepage stores + Header nav + `/app` stores + quick access + `/app/store` dropdown
5. Module 2: refactor `/app/account`
6. Module 3: Omni Search (Header + serverFn)

## Ràng buộc bắt buộc
- Modal `/admin/stores` = Centered Dialog, y hệt `/admin/products` (không Drawer)
- Không đổi Bottom Nav mobile
- Không sửa các file auto-gen supabase
- Server fn có auth (`requireSupabaseAuth`) cho admin write; public read qua supabase client trực tiếp là được (có RLS)
- Toast dùng sonner đang có

Xin duyệt plan để tôi bắt đầu.
