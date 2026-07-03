import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-primary text-white hover:bg-brand-primary-dark shadow-soft",
  secondary:
    "bg-brand-surface text-brand-text border border-brand-border hover:bg-brand-bg",
  ghost:
    "bg-transparent text-brand-muted hover:bg-brand-bg hover:text-brand-text border border-transparent",
  danger: "bg-status-error text-white hover:opacity-90 shadow-soft",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-4 text-[14px]",
  sm: "h-9 px-3 text-[13px]",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[8px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  ),
);
Button.displayName = "Button";
