export type ProductCategoryKey =
  | "may_cong_nghe"
  | "phu_kien"
  | "thuc_duong"
  | "kinh_doanh_vita";

export const PRODUCT_CATEGORIES: { key: ProductCategoryKey; label: string }[] = [
  { key: "may_cong_nghe", label: "Máy công nghệ" },
  { key: "phu_kien", label: "Phụ kiện" },
  { key: "thuc_duong", label: "Sản phẩm thực dưỡng" },
  { key: "kinh_doanh_vita", label: "Kinh doanh cùng Vita TH Pro" },
];

export const productCategoryLabel = (key?: string | null) =>
  PRODUCT_CATEGORIES.find((c) => c.key === key)?.label ?? "—";

// Service category suggestions (free text — used as suggestions)
export const SERVICE_CATEGORY_SUGGESTIONS = [
  "Chăm sóc da",
  "Trị liệu cơ thể",
  "Thải độc",
  "Tái tạo năng lượng",
  "Chăm sóc chuyên sâu",
];
