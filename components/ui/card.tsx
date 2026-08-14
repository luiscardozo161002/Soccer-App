import { ReactNode } from "react";
import { motion } from "framer-motion";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={`rounded-2xl border border-border bg-surface shadow-[0_16px_40px_-24px_rgba(15,23,42,0.22)] dark:shadow-[0_16px_40px_-24px_rgba(0,0,0,0.5)] ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-5">
      <div>
        <h2 className="text-base font-bold tracking-tight text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
