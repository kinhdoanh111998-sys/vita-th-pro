import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

type SortDir = "asc" | "desc";
type SortValue = string | number | Date | null | undefined;

type Col<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => SortValue;
};

function compare(a: SortValue, b: SortValue): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1; // null/undefined luôn xuống cuối
  if (b == null) return -1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "vi", { sensitivity: "base", numeric: true });
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
}: {
  columns: Col<T>[];
  rows: T[];
}) {
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => String(c.key) === sort.key);
    if (!col) return rows;
    const getVal = (row: T): SortValue => {
      if (col.sortValue) return col.sortValue(row);
      const v = row[col.key as keyof T] as unknown;
      if (v == null) return null;
      if (typeof v === "string") {
        // Thử parse date ISO
        const d = new Date(v);
        if (!Number.isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(v)) return d;
      }
      return v as SortValue;
    };
    const arr = [...rows].sort((a, b) => compare(getVal(a), getVal(b)));
    if (sort.dir === "desc") arr.reverse();
    return arr;
  }, [rows, columns, sort]);

  const cycleSort = (key: string) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  return (
    <div className="overflow-auto bg-brand-surface border border-brand-border rounded-[12px] shadow-soft">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="bg-brand-bg">
            {columns.map((c) => {
              const isActive = sort?.key === String(c.key);
              const Icon = !isActive
                ? ArrowUpDown
                : sort!.dir === "asc"
                  ? ArrowUp
                  : ArrowDown;
              return (
                <th
                  key={String(c.key)}
                  className="text-left px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-brand-muted border-b border-brand-border"
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() => cycleSort(String(c.key))}
                      className={`inline-flex items-center gap-1.5 transition-colors hover:text-brand-primary ${
                        isActive ? "text-brand-primary" : ""
                      }`}
                      title="Bấm để sắp xếp"
                    >
                      <span>{c.label}</span>
                      <Icon
                        size={13}
                        className={isActive ? "opacity-100" : "opacity-40"}
                      />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row, i) => (
            <tr
              key={i}
              className="hover:bg-brand-bg transition-colors border-b border-brand-border last:border-b-0"
            >
              {columns.map((c) => (
                <td
                  key={String(c.key)}
                  className="px-4 py-3 text-[14px] text-brand-text align-middle"
                >
                  {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

