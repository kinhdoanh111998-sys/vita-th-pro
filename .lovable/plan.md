
## Xác định loại Zalo App

Với App ID + Secret Key, bạn đang có **Zalo Login (Web OAuth v4)** — luồng chuẩn OAuth 2.0 qua `oauth.zaloapp.com/v4/permission`. Tôi đã tích hợp nhiều lần, đây là stack quen thuộc.

## Callback URL cần cấu hình

Trong **Zalo Developer Console → App của bạn → Login → Redirect URI**, thêm CẢ HAI URL (một cho preview, một cho published):
```
https://view-forge-space.lovable.app/auth/zalo/callback
https://id-preview--dca46c99-31ca-4f56-9e9f-8995fba18e1c.lovable.app/auth/zalo/callback
```
Sau khi publish custom domain thì thêm domain đó nữa.

## Cảnh báo về "mk = SĐT vĩnh viễn"

Tôi vẫn triển khai theo yêu cầu, nhưng **cảnh báo rõ**: nếu ai lộ SĐT khách (rất dễ, SĐT vốn không phải bí mật), họ đăng nhập được ngay bằng form login thường mà **không cần Zalo**. Rủi ro cực cao khi mở rộng khách hàng. Đề xuất backup: sau lần đầu tôi thêm 1 banner "Vui lòng đổi mật khẩu để bảo mật" ở trang tài khoản (không ép). Bạn đồng ý cứ để triển khai.

## Kiến trúc luồng

```text
[User click "Đăng nhập Zalo"]
        │
        ▼
GET /api/public/zalo/authorize   ← server route sinh state + PKCE, redirect
        │
        ▼
oauth.zaloapp.com/v4/permission  ← user cho phép (permission: id, name, picture, phone)
        │
        ▼
/auth/zalo/callback?code=...&state=...   ← route TSS (page)
        │
        ▼
serverFn zaloExchangeAndSignIn({ code, codeVerifier, state })
   1. Verify state (cookie)
   2. POST oauth.zaloapp.com/v4/access_token   → access_token
   3. GET graph.zalo.me/v2.0/me?fields=id,name,picture,phone
   4. Nếu chưa có phone: trả error → client redirect lại authorize (fallback bạn muốn)
   5. Chuẩn hoá phone (bỏ +84 → 0…)
   6. supabaseAdmin.auth.admin: tìm user theo email ảo <phone>@khach.vitath.pro
        - Nếu chưa có: createUser({ email, password: phone, email_confirm: true })
          + insert users(role='customer', full_name)
          + insert customers(phone, name, avatar_url, zalo_id)
        - Nếu đã có: update avatar/name mới nhất
   7. Trả về { email, password: phone } cho client
        │
        ▼
Client: supabase.auth.signInWithPassword({ email, password })
        │
        ▼
Redirect /app (customer landing đã có sẵn)
```

## Fallback khi user không đồng ý cho SĐT

Đúng như bạn muốn — khả thi và tôi sẽ làm:
- Server nhận `/me` không có `phone` → trả `{ error: "phone_required" }`
- Client hiện toast "Bạn cần đồng ý chia sẻ số điện thoại để đăng nhập" + tự động redirect lại trang authorize Zalo sau 2s (user bấm lại Cho phép).

## Thay đổi cụ thể

### 1. Secrets (Lovable Cloud)
Tôi sẽ mở form add_secret cho bạn nhập:
- `ZALO_APP_ID` (public cũng được nhưng để chung server cho gọn)
- `ZALO_APP_SECRET` (bắt buộc secret)

### 2. Database migration
Thêm cột vào `customers`:
- `zalo_id text unique` — id Zalo để tránh trùng
- `avatar_url text` (nếu chưa có)

Không tạo bảng mới.

### 3. File mới
- `src/routes/api/public/zalo.authorize.ts` — server route: sinh `state` random + PKCE `code_verifier`, lưu vào httpOnly cookie 5 phút, redirect sang Zalo OAuth URL.
- `src/routes/auth.zalo.callback.tsx` — route TSS page: đọc `code` từ URL, gọi serverFn `zaloExchangeAndSignIn`, rồi `signInWithPassword`, rồi navigate `/app`. Hiển thị spinner "Đang đăng nhập bằng Zalo…".
- `src/lib/zalo-auth.functions.ts` — chứa serverFn `zaloExchangeAndSignIn` (dùng `supabaseAdmin` import động trong handler, KHÔNG top-level).
- `src/lib/zalo-auth.server.ts` — helper gọi Zalo Graph API, chuẩn hoá phone.

### 4. File chỉnh
- `src/routes/login.tsx` — thêm nút **"Đăng nhập bằng Zalo"** (icon Zalo, màu #0068FF) phía trên form email/password, dẫn tới `/api/public/zalo/authorize`.
- `src/routes/dang-ky.tsx` — thêm cùng nút Zalo với gợi ý "Không cần đăng ký, dùng Zalo là xong".

Không đụng `client.ts`, `types.ts`, `AuthContext.tsx`, không phá luồng login cũ.

## Chi tiết kỹ thuật quan trọng

- **Endpoint Zalo** (v4):
  - Authorize: `https://oauth.zaloapp.com/v4/permission?app_id=&redirect_uri=&code_challenge=&state=`
  - Token: `POST https://oauth.zaloapp.com/v4/access_token` header `secret_key`, body `code, app_id, grant_type=authorization_code, code_verifier`
  - Graph: `GET https://graph.zalo.me/v2.0/me?fields=id,name,picture,phone` header `access_token`
- **PKCE bắt buộc** cho Zalo v4 (S256).
- **`state` chống CSRF** lưu httpOnly cookie, verify server-side.
- **Chuẩn hoá phone**: Zalo trả `+84…` hoặc `84…` → convert về `0…` để khớp format bạn đã dùng cho khách hàng.
- **try/catch + finally**: mọi bước gọi API + Supabase đều bọc try/catch, callback page có `finally { setLoading(false) }` để không kẹt spinner (đúng convention CQC của bạn).
- **Email ảo**: dùng đúng domain hiện tại `@khach.vitath.pro` để `AuthContext` fast-track customer sẵn có tự nhận.

## Số credit dự kiến

~4–5 credits cho toàn bộ Phase (1 migration + 4 file mới + 2 file chỉnh + secret form + typecheck).

---

**Xác nhận để tôi bắt đầu:**
1. Bấm **Approve plan** để chuyển sang build mode.
2. Sau khi build mode kích hoạt, tôi sẽ mở form nhập `ZALO_APP_ID` + `ZALO_APP_SECRET` trước tiên.
3. Trong lúc chờ, bạn vào Zalo Developer Console thêm 2 Callback URL ở trên.
