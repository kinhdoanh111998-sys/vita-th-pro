## Vấn đề
Luồng `/api/public/zalo/authorize` hiện tự tạo `redirect_uri` theo `origin` của request. Nếu người dùng đang mở app qua một domain khác với domain đã khai báo callback trên Zalo, Zalo sẽ báo `-14003 URI chuyển hướng không hợp lệ` dù trong Zalo Developer đã có một số callback URL.

## Kế hoạch sửa
1. **Khóa domain callback ưu tiên**
   - Tạo helper chọn base URL cho Zalo OAuth theo thứ tự an toàn:
     1. custom domain production `https://cs1.vitath.pro`
     2. published domain `https://view-forge-space.lovable.app`
     3. fallback origin hiện tại nếu đang dev/local.
   - Redirect URI cuối cùng luôn là `<base>/auth/zalo/callback` để khớp danh sách Callback URL trong Zalo Developer.

2. **Đồng bộ entry point đăng nhập/đăng ký Zalo**
   - Các nút Zalo trong `/login`, `/dang-ky`, dialog yêu cầu đăng nhập và retry trong callback vẫn gọi `/api/public/zalo/authorize`.
   - Server route sẽ quyết định redirect URI thống nhất, tránh mỗi domain/preview tự phát sinh một callback khác nhau.

3. **Cải thiện xử lý lỗi callback**
   - Nếu Zalo trả `error`/`error_description`, hiển thị thông báo rõ hơn thay vì chỉ điều hướng chung.
   - Giữ nguyên logic đổi code, tạo/đăng nhập khách hàng hiện tại để không phá flow đang chạy.

4. **Kiểm tra failsafe**
   - Kiểm tra URL mà `/api/public/zalo/authorize` redirect tới Zalo có `redirect_uri=https://cs1.vitath.pro/auth/zalo/callback`.
   - Đảm bảo route `/auth/zalo/callback` vẫn tồn tại và không đổi database/schema.

## Ghi chú cần làm ngoài code
Trong Zalo Developer, Callback URL phải có đúng dòng:
`https://cs1.vitath.pro/auth/zalo/callback`

Nếu muốn chạy trên staging/published domain Lovable thì giữ thêm:
`https://view-forge-space.lovable.app/auth/zalo/callback`