Mục tiêu: Thay thế placeholder trang /about bằng landing giới thiệu cao cấp, sử dụng ảnh banner đã upload và design tokens thương hiệu của dự án.

Các bước thực hiện:

1. Chuẩn bị asset banner
   - Sao chép ảnh `vita_slider_03.jpg` từ `user-uploads://` vào `public/vita_slider_03.jpg` để đường dẫn `/vita_slider_03.jpg` render đúng.

2. Cập nhật route trang Giới thiệu
   - File đích: `src/routes/_public.about.index.tsx` (route TanStack Start hiện đang là Placeholder).
   - Thay thế bằng component AboutPage đầy đủ nội dung:
     - Hero banner: ảnh nền toàn chiều rộng, overlay gradient, tiêu đề "Về Chúng Tôi" và headline.
     - Khối giới thiệu chính về Vita TH Pro.
     - Grid Tầm nhìn – Sứ mệnh với icon và card.
     - Grid 3 cột Giá trị cốt lõi (Chuyên nghiệp, Tận tâm, Vững bền).
   - Áp dụng design tokens:
     - Màu chủ: `#1B9606` (`brand-primary`), nền `brand-bg`/`brand-surface`, văn bản `brand-text`/`brand-muted`.
     - Font heading `Lexend Deca`, body `Inter`.
     - Bo góc `rounded-2xl` / `rounded-xl` chuẩn Figma.

3. Kiểm tra chất lượng
   - Chạy build kiểm tra lỗi TypeScript/JSX.
   - Xác nhận trang /about hiển thị đúng banner, typography, layout responsive.

Lưu ý: Chỉ làm nội dung tĩnh/UI cho MVP; không thay đổi routing, layout cha, hay logic dữ liệu động.