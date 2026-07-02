
# PHASE 1 — Đồng bộ Route Tài khoản & Auth State

Chỉ thi công Phase 1. Không đụng migration DB, không đụng logic ca/chấm công (dành cho Phase 2 & 3).

## 1. Trang `/app` — Profile đa nhiệm theo role

Tái cấu trúc `src/routes/app.index.tsx` (và điều chỉnh `AppLayout` nếu cần) để render theo `role` từ `useAuth()`:

- **role = customer**: bê nguyên UI hiện có của `/khach-hang` sang. Sau đó **redirect `/khach-hang` → `/app`** (đổi `src/routes/khach-hang.tsx` thành route redirect) để tránh duy trì 2 nơi.
  - Khối bê nguyên: "Liệu trình còn khả dụng" (dropdown QR thông minh), "Liệu trình đã sử dụng", "Đơn hàng lịch sử", "Tiếp thị liên kết" (Hình 4), "Đã giới thiệu thành công".
  - Bổ sung 2 thẻ mới:
    - **Thẻ Hoa hồng**: tái sử dụng `PerformanceCard` từ `src/components/portal/dashboard/PerformanceCard.tsx` (đổi copy phù hợp customer, hoặc bọc lại thành `CustomerCommissionCard` nếu source query khác).
    - **Khối Đổi thưởng / Lịch sử đổi thưởng**: static UI (chưa nối DB), 2 tab hoặc 2 card cạnh nhau, empty state "Chưa có phần thưởng nào".
- **role = staff / technician / sale**: form thông tin cá nhân cơ bản (họ tên, email, phone, avatar — readonly hoặc cho update `full_name`/`phone` qua `users` table nếu cột đã có) + nút CTA nổi bật **"Vào Workspace Vận Hành"** → `/portal/dashboard`.
- **role = admin / manager**: form thông tin cá nhân + nút CTA **"Vào Hệ Thống Quản Trị Admin"** → `/admin`.
- Fallback role không xác định: hiện form cơ bản + nút "Về trang chủ".

Xoá route con `src/routes/app.account.tsx` (nội dung placeholder) hoặc chuyển hướng nó về `/app`.

## 2. Cross-Navigation link Profile

- **Sidebar `/portal`** (`src/routes/portal.tsx` + navbar bên trong): thêm 1 mục "Hồ sơ của tôi" (icon User) → `/app`.
- **Sidebar `/admin`** (`src/components/AdminSidebar.tsx` hoặc `AdminTopbar.tsx`): thêm icon/link Profile → `/app`.

## 3. Notification Router

- Cập nhật handler onClick của Notification (nơi list notification — dự kiến `src/routes/app.notifications.tsx` + component dropdown ở header nếu có):
  - Đọc `notifications.type` và/hoặc trường `redirect_url` (nếu đã có cột, nếu chưa thì fallback theo `type`).
  - Map cứng bảng chuyển hướng theo role + type, ví dụ:
    - `type='shift_approved'` + role staff → `/portal/dashboard`
    - `type='new_booking'` + role staff → `/portal/bookings`
    - `type='order_paid'` + role customer → `/app` (mục Đơn hàng)
    - `type='shift_request_pending'` + role admin → `/admin/shifts`
  - Nếu có `redirect_url` hợp lệ (same-origin) thì ưu tiên nó.
  - Sau khi navigate, đánh dấu `read=true` (giữ hàm đã có nếu có).

## 4. Fix Auth header trang chủ `/homepage`

- File `src/components/Header.tsx` (dùng cho `_public`):
  - Đọc `useAuth()` (đã có `session`, `role`, `fullName`).
  - Nếu `session` tồn tại → ẩn cụm nút "Đăng ký" + "Đăng nhập", thay bằng nút duy nhất **"Khu vực của tôi"** → `/app` (icon User + tên rút gọn).
  - Nếu chưa có session → giữ nguyên 2 nút hiện tại.
  - Đảm bảo không hydration mismatch: có thể dùng `useHydrated()` gate hoặc render dựa vào loading state của AuthContext.

## 5. Trang `/about` — 4 khối tĩnh chuẩn Luxury Clinic

Đã có sẵn các file `_public.about.*.tsx` (history, team, testimonials, certifications, index). Nhiệm vụ:
- Rà lại `_public.about.tsx` làm layout tab/nav 4 mục.
- Viết lại UI tĩnh (Tailwind, tông brand-dark + brand + hairline hiện có) cho:
  1. **Lịch sử phát triển** — Timeline dọc (2 cột so le trên desktop, 1 cột mobile), mốc năm + mô tả + ảnh minh hoạ (dùng placeholder gradient nếu chưa có ảnh thật).
  2. **Đội ngũ chuyên gia** — Grid 3 cột (md), card avatar tròn, tên, chức danh, chuyên môn ngắn, hover shadow.
  3. **Khách hàng nói về chúng tôi** — Testimonials grid (2–3 cột), icon quote, quote text, avatar + tên khách + dịch vụ đã dùng, sao rating.
  4. **Chứng nhận & Chứng chỉ** — Grid card certificate với khung viền vàng nhạt/hairline, tên chứng chỉ, đơn vị cấp, năm; có thể click zoom (Dialog) hiển thị ảnh certificate.
- Nội dung tĩnh: text tiếng Việt, thương hiệu **Vita TH Pro**. Không nối DB ở phase này.
- Mỗi route con set `head()` riêng (title + description + og:title + og:description).

## 6. Quy tắc kỹ thuật bắt buộc

- Mọi call Supabase (nếu có ở /app customer): `try/catch` + `finally { setLoading(false) }`.
- Không đụng: migration DB, `staff_shifts`, `attendances`, widget chấm công, admin shifts calendar, homepage "Cửa hàng liên kết", dropdown chi nhánh — **để Phase 2 & 3**.
- Không sửa các file auto-gen (`src/integrations/supabase/*`, `routeTree.gen.ts`, `.env`).
- Chạy `tsgo` sau khi xong Phase 1 để verify.

## Deliverables

| File | Hành động |
|---|---|
| `src/routes/app.index.tsx` | Viết lại: render theo role |
| `src/routes/khach-hang.tsx` | Redirect → `/app` |
| `src/routes/app.account.tsx` | Xoá hoặc redirect |
| `src/components/portal/CustomerCommissionCard.tsx` (nếu cần) | Bọc PerformanceCard cho customer |
| `src/components/portal/RewardExchangeCard.tsx` | Static UI mới |
| `src/routes/portal.tsx` + sidebar | Thêm link "Hồ sơ" → `/app` |
| `src/components/AdminSidebar.tsx` | Thêm link "Hồ sơ" → `/app` |
| `src/routes/app.notifications.tsx` + notification click handler | Router theo type/redirect_url |
| `src/components/Header.tsx` | Auth-aware nút "Khu vực của tôi" |
| `src/routes/_public.about.tsx` + 4 route con | Static UI 4 khối luxury |

Sau khi Phase 1 xong, mình sẽ báo cáo và **chờ bạn duyệt** rồi mới sang Phase 2 (batch approval + lock tuần mẫu + admin duyệt).
