## Mục tiêu

Khi bất kỳ khách hàng nào chia sẻ link (bài viết, sản phẩm, dịch vụ, sự kiện…) kèm mã giới thiệu (`?ref=A7K2QX`), người bấm vào sẽ:

1. Được ghi nhận ref **im lặng** khi vào trang (không popup làm phiền).
2. Khi thực hiện hành động cần đăng nhập (đặt lịch, mua hàng, bình luận, đăng ký voucher…) → hiện popup **"Bạn cần đăng nhập"** với 3 lựa chọn: Đăng nhập Zalo / Đăng ký / Đăng nhập email.
3. Sau khi đăng ký/đăng nhập Zalo lần đầu → ref được **gán vĩnh viễn** vào tài khoản (`customers.referred_by`). Mọi đơn hàng, booking sau này của khách đó đều sinh hoa hồng cho người ref (**lifetime**).
4. Nếu khách tắt popup không đăng ký → ref vẫn giữ **30 ngày** trên trình duyệt (localStorage). Lần sau quay lại đăng ký/đăng nhập vẫn được tính.

---

## 1. Database

Migration mới:

- **`customers`**:
  - `ref_code TEXT UNIQUE` — mã 6 ký tự sinh tự động (VD: `A7K2QX`), dùng làm `?ref=`.
  - `referred_by UUID REFERENCES customers(id)` — người đã giới thiệu (nullable, set 1 lần, không đổi được sau khi set).
  - `referred_at TIMESTAMPTZ` — thời điểm gán ref.
  - Trigger: khi INSERT customer, nếu `ref_code` NULL thì tự sinh code ngẫu nhiên 6 ký tự (kiểm tra unique, retry nếu trùng).
  - Backfill: cấp `ref_code` cho toàn bộ customers hiện có.

- **`referral_clicks`** (mới, để đo funnel — optional nhưng nên có):
  - `id, ref_code, landing_path, ip_hash, user_agent, session_id, created_at, converted_customer_id`.
  - RLS: chỉ admin/manager đọc; INSERT bằng server function public.

- **`commissions`**: giữ nguyên schema; thêm `commission_type = 'affiliate_order'` khi đơn hàng của khách được ref chuyển sang `paid`.

- **Trigger `orders_after_paid_affiliate`**: khi `orders.status` chuyển sang `paid`, tra `customers.referred_by` của `orders.customer_id` — nếu có, tạo record `commissions` với `staff_id = referred_by`, `commission_type = 'affiliate_order'`, `amount = orders.total * affiliate_configs.commission_percent / 100`, `reference_id = orders.id`, `status = 'pending'`.

---

## 2. Ref tracking phía client (không popup khi lướt)

- **Hook `useRefTracker()`** đặt trong `_public.tsx` layout (chạy trên mọi trang public):
  - Đọc `?ref=` từ URL. Nếu có → lưu vào `localStorage` (`vitath_ref_v2 = { code, savedAt }`) và gọi API `/api/public/ref/click` để log analytics.
  - Nếu localStorage đã có ref cũ **và** ref cũ chưa quá 30 ngày → giữ nguyên (**first-touch attribution**, không đè). Sau 30 ngày mới cho phép ghi đè.
  - Xoá `?ref=` khỏi URL bằng `router.navigate({ replace: true, search: (s) => ({...s, ref: undefined}) })` để link trông sạch sau lần đầu.

- **Helper `getStoredRef()`**: đọc ref còn hạn từ localStorage, trả về `code` hoặc `null`. Dùng ở mọi submit form.

---

## 3. Popup "Cần đăng nhập" (chỉ hiện khi action)

- **`<RequireAuthDialog>`** component chung, thay cho các dòng "Vui lòng đăng nhập" hiện tại.
  - 3 nút: **Đăng nhập bằng Zalo** (nhanh nhất, nhấn mạnh), **Đăng ký tài khoản mới**, **Đăng nhập email**.
  - Nhận prop `intent` (booking / order / comment / voucher) để hiển thị context câu chữ.
  - Sau khi login xong, tự quay lại action đang dở (dùng `sessionStorage.pending_action`).

- Wrap các nút hành động: "Đặt lịch ngay", "Mua ngay", "Gửi bình luận", "Nhận voucher"… → nếu chưa auth thì mở dialog thay vì submit.

- Trang tự bật popup **KHÔNG** làm. Ref đã được lưu ngầm ở bước 2.

---

## 4. Gán ref khi đăng ký / đăng nhập Zalo lần đầu

Cập nhật `zalo-auth.functions.ts` (`zaloExchangeAndSignIn`):

- Nhận thêm input `refCode?: string` (client đọc từ `getStoredRef()` gửi lên khi callback).
- Trong nhánh **create user** (khách mới):
  - Tra `customers` theo `ref_code = refCode` → lấy `referrer_id`.
  - INSERT customer mới với `referred_by = referrer_id`, `referred_at = now()`.
  - Không cho tự ref bản thân.
- Trong nhánh **user đã tồn tại**: KHÔNG đè `referred_by` (đã set 1 lần là vĩnh viễn).

Tương tự cho flow đăng ký email (`/dang-ky`): đọc `getStoredRef()` khi submit, truyền vào server function tạo customer.

Sau khi login/signup thành công → **xoá** ref khỏi localStorage (đã gán vào DB rồi).

---

## 5. AffiliateCard (portal) — dùng ref_code mới

- Đổi `refCode = customer.ref_code` (thay vì `uid`).
- Link ref: `${origin}/?ref=${ref_code}` (landing trang chủ), có thể thêm helper "chia sẻ trang này" trên từng trang sản phẩm/bài viết để link ra `/products/xxx?ref=...`.
- Query "Đã giới thiệu": `count(customers where referred_by = <my_customer_id>)`.
- Query "Hoa hồng": `sum(commissions.amount where staff_id = <my_customer_id> and commission_type = 'affiliate_order')`.

---

## 6. Admin

- `/admin/commissions`: thêm filter theo `commission_type = 'affiliate_order'`, cột "Từ đơn hàng", "Người giới thiệu", "Khách mua".
- `/admin/settings` → tab affiliate: đã có `affiliate_configs` — chỉ cần đảm bảo có ít nhất 1 config `active = true` với `commission_percent` mặc định (VD 5%). Trigger đọc config này để tính.

---

## Câu trả lời cho 2 lo lắng của bạn

- **"Trường hợp khách đăng ký/đăng nhập Zalo sẽ được tính là ref ngay"** → Đúng, bước 4 gán `referred_by` ngay trong lần tạo tài khoản.
- **"Trường hợp khách tắt popup thì link ref vẫn được tính đúng chứ"** → Đúng, ref đã lưu vào localStorage ở bước 2 ngay khi vào trang (trước cả khi popup xuất hiện), giữ 30 ngày. Bất kỳ lúc nào trong 30 ngày đó khách quay lại và đăng ký → ref vẫn được gán. Chỉ mất khi khách xoá cookies/localStorage hoặc quá 30 ngày.

---

## Chi tiết kỹ thuật

- **Ref code generator**: `substring(md5(random()::text || clock_timestamp()::text), 1, 6)` viết hoa, kiểm tra unique.
- **Attribution model**: first-touch (ref đầu tiên trong 30 ngày thắng), lifetime (mọi đơn của khách được ref đều sinh hoa hồng, không hết hạn).
- **Chống self-referral**: check `referrer_id != new_customer_id` trong trigger.
- **Chống fraud cơ bản**: không tạo hoa hồng nếu đơn `refunded/cancelled`; hoa hồng ở status `pending` → admin duyệt manual sang `approved/paid` trong `/admin/commissions`.
- **File sẽ đụng**: migration mới; `src/lib/refTracker.ts` (mới); `src/routes/_public.tsx` (mount hook); `src/components/RequireAuthDialog.tsx` (mới); `src/lib/zalo-auth.functions.ts` (nhận refCode); `src/routes/auth.zalo.callback.tsx` (truyền refCode); `src/routes/dang-ky.tsx` (truyền refCode); `src/components/portal/dashboard/AffiliateCard.tsx` (dùng ref_code); `src/routes/admin.commissions.tsx` (filter mới); các nút action ở booking/order/comment (wrap `<RequireAuthDialog>`).
