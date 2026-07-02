## Vấn đề #2 — Root cause (đã xác định)

Trigger `trg_orders_insert_paid_generate_treatments` chạy **AFTER INSERT** trên `orders`, nhưng code `admin.orders.tsx` insert theo thứ tự:

1. `INSERT orders (status='paid')` → trigger fire ngay → duyệt `order_items` → **rỗng** → 0 treatments.
2. `INSERT order_items` (sau khi trigger đã chạy xong) → không còn cơ chế nào sinh treatments.

Bằng chứng: 3 đơn mới nhất (`020726-001/002/003`) đều có `items=1` nhưng `treatments=0`.

## Kế hoạch sửa

### A. Sửa luồng tạo đơn (`src/routes/admin.orders.tsx`)

Đổi thứ tự để tận dụng **UPDATE trigger** (`trg_orders_paid_generate_treatments` fire khi status: non-paid → paid):

1. `INSERT orders` với `status='pending'` (trigger insert bỏ qua).
2. `INSERT order_items` đầy đủ.
3. `UPDATE orders SET status='paid'` → UPDATE trigger duyệt `order_items` (đã có sẵn) → sinh treatments đúng.

### B. Backfill 3 đơn bị lỗi

Migration chạy `UPDATE orders SET status='paid' WHERE status='paid'` cho 3 order_code nói trên sẽ không fire trigger (không có transition). Dùng cách: `UPDATE orders SET status='pending' WHERE id IN (...); UPDATE orders SET status='paid' WHERE id IN (...);` để trigger sinh treatments cho các đơn đang thiếu.

### C. Tính năng Xem & Sửa đơn hàng (Yêu cầu #1)

Thêm nút **Xem** ở mỗi hàng trong bảng `/admin/orders`, mở `Sheet` "Chi tiết đơn hàng":

**Panel xem (read-only đối với đơn `status='paid'`):**
- Header: mã đơn, ngày, trạng thái, tổng tiền.
- Thông tin khách hàng (tên, SĐT).
- Người bán + % hoa hồng.
- Voucher đã áp (nếu có).
- Bảng `order_items`: tên SP/DV, đơn giá, SL, thành tiền.
- Tổng tạm tính / giảm giá / tổng cuối.
- Danh sách treatments đã sinh (nếu là dịch vụ) — link đến `/admin/treatments`.

**Chức năng Sửa (an toàn):**
- Đơn `pending`: cho phép sửa toàn bộ (items, khách, voucher, người bán, %HH). Khi bấm "Xác nhận thanh toán" → chuyển `status='paid'` → trigger sinh treatments.
- Đơn `paid`: chỉ cho phép sửa **metadata** (người bán, %HH, ghi chú). Không cho sửa items để tránh lệch treatments đã sinh. Nếu muốn sửa items phải "Hủy đơn" (`status='cancelled'`) rồi tạo đơn mới.
- Nút **Hủy đơn** (chỉ Admin): set `status='cancelled'`, không xóa treatments đã sinh (giữ lịch sử) — hiện cảnh báo rõ.

### D. Bổ sung nhỏ

- Trong `CreateOrderDrawer.onSubmit`: sau khi update status='paid' thành công, `invalidateQueries(["treatments"])` như hiện tại.
- Thêm cột **Chi tiết** (icon Eye) ở bảng đơn.

## Chi tiết kỹ thuật

- File chỉnh sửa: `src/routes/admin.orders.tsx` (tách `OrderDetailDrawer` component mới).
- Migration: 1 file backfill treatments cho 3 đơn thiếu.
- Không đụng schema, không đụng trigger (đã hoạt động đúng ở nhánh UPDATE).
- RLS: đã có policy cho admin/manager trên `orders`, `order_items`, `treatments` — không cần bổ sung.

## Không làm

- Không viết lại trigger.
- Không thay đổi flow `/khach-hang` (sẽ tự cập nhật khi treatments được sinh đúng).
- Không thêm bảng mới.