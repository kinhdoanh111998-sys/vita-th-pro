import { type ReactNode } from "react";

type Col<T> = { key: keyof T | string; label: string; render?: (row: T) => ReactNode };

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
}: {
  columns: Col<T>[];
  rows: T[];
}) {
  return (
    <div className="overflow-auto bg-white border border-hairline rounded-2xl">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={String(c.key)}
                className="text-left px-3.5 py-3 text-[12px] font-bold uppercase tracking-wider bg-brand-lime text-[#34483a] border-b border-[#edf3ed]"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td
                  key={String(c.key)}
                  className="px-3.5 py-3 text-sm border-b border-[#edf3ed] align-top"
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
