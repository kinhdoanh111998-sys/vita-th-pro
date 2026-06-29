// Tiện ích xuất CSV đơn giản (UTF-8 BOM để Excel mở tiếng Việt đúng).
export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: string; label: string; format?: (v: unknown, row: T) => string }[],
): string {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n\r;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map((c) => esc(c.label)).join(",");
  const body = rows
    .map((r) =>
      columns
        .map((c) => esc(c.format ? c.format(r[c.key], r) : (r[c.key] as unknown)))
        .join(","),
    )
    .join("\n");
  return "\uFEFF" + header + "\n" + body;
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
