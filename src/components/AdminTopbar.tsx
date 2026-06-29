import type { ReactNode } from "react";

export function AdminTopbar({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 mb-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {right ?? (
          <span className="hidden sm:inline rounded-full bg-brand-soft text-brand-dark px-3 py-1.5 text-xs font-extrabold">
            Demo UI
          </span>
        )}
      </div>
    </div>
  );
}
