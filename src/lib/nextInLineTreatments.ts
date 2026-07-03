/**
 * Nhóm treatments theo order_id (thẻ liệu trình) và chỉ trả về
 * buổi kế tiếp (session_number nhỏ nhất còn 'pending') cho mỗi thẻ.
 * Ẩn hoàn toàn các buổi phía sau để dropdown không bị rối khi khách
 * có liệu trình dài 10-20 buổi.
 */
export type NextInLineTreatment<T extends {
  id: string;
  order_id: string;
  session_number: number;
  status: string;
  service_id: string | null;
}> = T & { remaining: number };

export function nextInLineTreatments<
  T extends {
    id: string;
    order_id: string;
    session_number: number;
    status: string;
    service_id: string | null;
  }
>(rows: T[] | null | undefined, customerId?: string | null): NextInLineTreatment<T>[] {
  if (!rows?.length) return [];
  const filtered = customerId
    ? rows.filter((r) => (r as unknown as { customer_id?: string }).customer_id === customerId)
    : rows;

  const groups = new Map<string, T[]>();
  for (const t of filtered) {
    if (!t || t.status !== "pending") continue;
    const list = groups.get(t.order_id) ?? [];
    list.push(t);
    groups.set(t.order_id, list);
  }

  const out: NextInLineTreatment<T>[] = [];
  for (const [, list] of groups) {
    list.sort((a, b) => (a.session_number ?? 0) - (b.session_number ?? 0));
    const next = list[0];
    if (!next) continue;
    out.push({ ...next, remaining: list.length });
  }
  // Ổn định thứ tự hiển thị: theo session_number rồi order_id
  out.sort((a, b) =>
    (a.session_number ?? 0) - (b.session_number ?? 0) || a.order_id.localeCompare(b.order_id),
  );
  return out;
}
