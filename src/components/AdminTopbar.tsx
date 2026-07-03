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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="font-heading text-[24px] font-semibold tracking-tight text-brand-text leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-[14px] text-brand-muted mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {right ?? (
          <span className="inline-flex items-center rounded-full bg-brand-primary-light text-brand-primary-dark px-3 py-1.5 text-[12px] font-semibold">
            Demo UI
          </span>
        )}
      </div>
    </div>
  );
}
