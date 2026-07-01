export type NewsRow = {
  id: string;
  title: string;
  cover_url: string | null;
  summary: string | null;
  content_rich: string | null;
  category: string;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NewsComment = {
  id: string;
  news_id: string;
  full_name: string;
  contact_info: string | null;
  content: string;
  status: "pending" | "approved" | "hidden";
  created_at: string;
};

export const NEWS_CATEGORIES = [
  "Kiến thức chăm sóc da",
  "Dịch vụ & Trị liệu chuyên sâu",
  "Ưu đãi độc quyền",
] as const;

export function formatNewsDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
