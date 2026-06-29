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
    "bg-brand text-white shadow-[0_10px_24px_rgba(73,169,66,0.22)] hover:bg-brand-dark",
  secondary:
    "bg-white text-brand-dark border border-hairline hover:bg-brand-soft",
  ghost:
    "bg-transparent text-brand-dark hover:bg-brand-soft border border-transparent",
  danger: "bg-destructive text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  md: "px-4 py-[11px] text-sm",
  sm: "px-3 py-2 text-[13px]",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-extrabold transition-colors cursor-pointer",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    />
  ),
);
Button.displayName = "Button";
