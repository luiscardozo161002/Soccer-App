import { HTMLMotionProps, motion } from "framer-motion";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "md" | "icon";

// A soft, color-matched shadow under each variant so buttons read as
// physically "raised" surfaces, not just colored text/backgrounds.
const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-md shadow-primary/30 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/40",
  secondary: "bg-primary-light text-ink shadow-sm shadow-primary/15 hover:bg-primary/20 hover:shadow-md hover:shadow-primary/25",
  danger: "bg-red-600 text-white shadow-md shadow-red-600/30 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/40",
  ghost: "text-muted shadow-sm shadow-black/5 hover:bg-primary-light hover:text-ink hover:shadow-md hover:shadow-black/10 dark:shadow-black/40 dark:hover:shadow-black/50",
};

const sizeClasses: Record<Size, string> = {
  md: "px-3.5 py-1.5 text-sm",
  icon: "p-1.5",
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
