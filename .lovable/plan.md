# Kế hoạch triển khai Omnichannel VITA TH Pro

Phạm vi lớn — chia 3 Module. Không phá UI/UX hay Auth/RPC hiện có. Mọi thay đổi DB đi qua migration + GRANT + RLS.

---

## MODULE 1 — UI/UX & Navigation

### 1.1 Cụm nút "Đặt lịch" (PC + Mobile)
- Sửa `FloatingActions.tsx` (và điểm gọi trong Header PC): nút **Đặt lịch** không mở dialog ngay, mà mở **Popover / BottomSheet** với 2 lựa chọn:
  - **Liên hệ Zalo** → mở link Zalo OA (đọc từ `system_settings.zalo_oa_url`, fallback hằng số).
  - **Tra cứu liệu trình** → điều hướng `/lookup`.
- Giữ nguyên logic auth/booking hiện có cho các nơi khác.

### 1.2 Fix mobile bị Bottom Bar che
- Trong `CustomerHomeContent.tsx` (khối 3 CTA hero mobile) thêm `pb-24 md:pb-0` để không bị `AppLayout` bottom nav che.

### 1.3 Homepage: thêm 2 section
- Trong `_public.index.tsx` (và/hoặc CustomerHomeContent nếu là block chung): thêm
  - **Sản phẩm nổi bật** — `services_public` `type=product` limit 8, dùng `ProductCard` app style.
  - **Dịch vụ nổi bật** — `services_public` `type=service` limit 8.
- **Đẩy "Feed Cộng đồng" xuống dưới** 2 section này.

### 1.4 Admin toggle "Danh sách Cửa hàng"
- Bảng `system_settings` đã có (key/value JSON). Thêm key `show_store_list` (boolean).
- Trong `/admin/navigation` thêm 1 Switch (shadcn) đọc/ghi qua `useSystemSettings`.
- Ba nơi cần điều kiện render:
  - `_public.index.tsx` — khối Cửa hàng gần bạn (PC).
  - `app.store.tsx` — trang cửa hàng mobile.
  - `app.index.tsx` — block "Cửa hàng gần bạn" mobile.
- Nếu OFF → không render + chuyển tab bottom "Cửa hàng" thành ẩn (fallback về Trang chủ).

---

## MODULE 2 — Global Cart & Product UI

### 2.1 Global Cart Store
- Tạo `src/lib/cart/useCartStore.ts` bằng **Zustand + persist(localStorage)**.
- Shape:
  ```ts
  type CartLine = { id, name, price, image, type: 'product'|'service', qty };
  ```
- API: `add(item)`, `remove(id)`, `setQty(id,n)`, `clear()`, `totalQty`, `totalAmount`.
- Cài `zustand` nếu chưa có.

### 2.2 Card danh sách (PublicCatalog + app ProductCard)
- Trong `ProductCard` (app) và card grid PC: đổi nút "Đặt mua ngay" thành 2 nút cạnh nhau: **[🛒]** (add) + **[Mua ngay]** (add + navigate `/checkout`).
- Thêm nút icon tròn **Share** floating góc phải-trên của hình → copy link `${origin}/products/{id}?ref={customerId}` vào clipboard + toast.

### 2.3 Trang chi tiết (`CatalogDetailLayout`)
- Sửa "Thêm vào giỏ hàng": bỏ nav sang `/contact`, thay bằng `cart.add(...)` + `toast.success`.
- Đổi nút "Quay lại" → **Mua ngay**: add + `navigate({to:'/checkout'})`.
- Thêm nút Share cạnh tiêu đề (icon Share2) → copy link ref.

### 2.4 Cart Icon + Slide-out
- Component `CartSheet.tsx` (shadcn Sheet) hiển thị các dòng, cập nhật qty, xoá, nút "Tiến hành thanh toán" → `/checkout`.
- Trigger:
  - **Header PC** (`components/layout/Header.tsx`): thêm icon giỏ + badge số lượng.
  - **AppLayout mobile**: nút giỏ floating góc phải-trên (bên cạnh notification bell nếu có).

---

## MODULE 3 — Checkout & Sync

### 3.1 Bắt buộc Auth
- Trang `/checkout` (thay thế `app.store.checkout.tsx` bằng route công khai `_public.checkout.tsx` để dùng chung PC/mobile? — **giữ path `/checkout`** mới, top-level).
- Nếu chưa login → mở `RequireAuthDialog` (đã có), không cho submit.

### 3.2 UI Checkout
- Auto-fill `full_name`, `phone` từ `customers` của user hiện tại (RLS cho phép đọc chính mình).
- Ô Voucher: query bảng `vouchers` + `voucher_conditions` — áp mã, hiển thị số tiền giảm.
- Chọn phương thức:
  - **COD** — submit tạo order.
  - **Chuyển khoản (VietQR)** — sau khi tạo order, popup mã QR động từ `https://img.vietqr.io/image/{BANK}-{ACC}-compact2.png?amount={total}&addInfo=VITA%20ORDER_{ORDER_CODE}&accountName=...`. Config bank đọc từ `system_settings`.

### 3.3 DB thay đổi (Migration)
Bảng `orders` — thêm cột:
- `payment_method text` (`cod` | `transfer`), default `cod`.
- `payment_status text` (`pending`|`paid`|`failed`), default `pending`.
- `order_source text` (`web`|`app`), default `web`.
- `voucher_code text` null, `discount_amount numeric` default 0.

**Không đổi** `status` hiện có; nhưng chỉnh trigger `generate_treatments_on_paid` để trigger dựa trên `payment_status='paid'` **HOẶC** giữ `status='paid'` như hiện tại — chọn **cập nhật cả 2**: khi admin đổi `payment_status`→`paid` thì đồng bộ `status='paid'` để trigger cũ chạy (không phá logic hiện có).

### 3.4 Logic Trigger
- Trigger hiện có `generate_treatments_on_paid` chạy khi `status` chuyển sang `paid`. Giữ nguyên.
- Thêm trigger BEFORE UPDATE trên `orders`: nếu `payment_status` chuyển sang `paid` và `status<>'paid'` → set `status='paid'` để tận dụng trigger cũ tạo `treatments`.

### 3.5 /admin/orders
- Bổ sung cột hiển thị `payment_method`, `payment_status`, `order_source` + action đổi `payment_status` → `paid`.

---

## Files sẽ tạo / sửa (tóm tắt)

**New:**
- `src/lib/cart/useCartStore.ts`
- `src/components/cart/CartSheet.tsx`
- `src/components/cart/CartButton.tsx`
- `src/components/ShareRefButton.tsx`
- `src/components/BookingActionMenu.tsx` (popover 2 lựa chọn)
- `src/routes/_public.checkout.tsx` (checkout dùng chung, có RequireAuth)
- Migration: thêm cột `orders` + trigger sync payment_status→status

**Edit:**
- `FloatingActions.tsx`, `layout/Header.tsx`, `AppLayout.tsx`
- `CustomerHomeContent.tsx`, `_public.index.tsx`
- `CatalogDetailLayout.tsx`, `PublicCatalogPage.tsx`, `app/ProductCard.tsx`
- `admin.navigation.tsx`, `admin.orders.tsx`
- `useSystemSettings.ts` (thêm key `show_store_list`)
- `app.store.tsx`, `app.index.tsx` (điều kiện show store)

---

## Ghi chú kỹ thuật
- Cart persist bằng `zustand/middleware persist`, key `vita-cart-v1`.
- Toast dùng `sonner` (`toast.success/error`).
- Try/catch bao quanh mọi call Supabase trong checkout, luôn `setSubmitting(false)` trong `finally`.
- Không đổi file auto-gen (`client.ts`, `types.ts`, `routeTree.gen.ts`).
- Zalo OA URL: đọc `system_settings.zalo_oa_url`, fallback `https://zalo.me/{id}` từ env nếu có, cuối cùng fallback `#`.

Xác nhận để tôi bắt đầu triển khai theo đúng thứ tự Module 1 → 2 → 3.
