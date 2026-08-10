import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "icon";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-[0_14px_28px_-10px_rgba(13,148,136,0.55)] hover:bg-primary-hover active:scale-[0.98]",
  secondary: "bg-slate-100 text-ink hover:bg-slate-200 active:scale-[0.98]",
  danger: "bg-red-600 text-white shadow-[0_14px_28px_-10px_rgba(220,38,38,0.5)] hover:bg-red-700 active:scale-[0.98]",
  ghost: "text-muted hover:bg-slate-100 hover:text-ink",
};

const sizeClasses: Record<Size, string> = {
  md: "px-4 py-2 text-sm",
  icon: "p-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}
