export type EventRow = {
  id: string;
  title: string;
  cover_url: string | null;
  content_rich: string | null;
  start_at: string;
  end_at: string;
  location: string | null;
  format: "online" | "offline";
  category: string | null;
  is_free: boolean;
  price: number | null;
  max_attendees: number | null;
  created_at: string;
};

export type EventMedia = {
  id: string;
  event_id: string;
  media_url: string;
  media_type: "image" | "video";
  created_at: string;
};

export type EventRegistration = {
  id: string;
  event_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  created_at: string;
};

export const EVENT_CATEGORIES = [
  "Hội thảo công nghệ",
  "Tri ân khách hàng",
  "Trải nghiệm dịch vụ",
] as const;

export function isUpcoming(e: Pick<EventRow, "end_at">): boolean {
  return new Date(e.end_at).getTime() > Date.now();
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
