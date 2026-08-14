import { HTMLMotionProps, motion } from "framer-motion";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "icon";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "bg-primary-light text-ink hover:bg-primary/20",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-muted hover:bg-primary-light hover:text-ink",
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
}: HTMLMotionProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <motion.button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={{ duration: 0.12 }}
      {...props}
    />
  );
}
