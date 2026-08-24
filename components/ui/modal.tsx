"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const sizeClasses = {
  sm: "w-full max-w-md",
  md: "w-full max-w-lg",
  lg: "w-full max-w-3xl",
} as const;

// Closes only via the header's X or the caller's own Cancelar/Guardar
// buttons — never on a backdrop click or Escape, so an in-progress edit
// can't be lost by an accidental click or keypress.
export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: keyof typeof sizeClasses;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-4 py-10 backdrop-blur-md sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className={`rounded-2xl bg-surface shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] ${sizeClasses[size]}`}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-3.5">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-ink">{title}</h2>
                {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-primary-light hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
