"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export interface ActionsMenuItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone?: "danger";
  disabled?: boolean;
}

const MENU_WIDTH = 176;

// Renders its menu through a portal so it isn't clipped by a scrolling
// Table or an overflow-hidden Card — both are common ancestors for a
// per-row actions button.
export function ActionsMenu({ items, label }: { items: ActionsMenuItem[]; label: string }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({ top: rect.bottom + 6, left: Math.max(8, rect.right - MENU_WIDTH) });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-lg p-2 text-muted shadow-sm shadow-black/5 transition-colors hover:bg-primary-light hover:text-ink dark:shadow-black/40"
      >
        <MoreVertical size={16} />
      </button>
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && position && (
              <motion.div
                ref={menuRef}
                role="menu"
                aria-label={label}
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                style={{ position: "fixed", top: position.top, left: position.left, width: MENU_WIDTH }}
                className="z-50 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.35)] dark:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.6)]"
              >
                {items.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false);
                      item.onClick();
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      item.tone === "danger"
                        ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-400/10"
                        : "text-ink hover:bg-primary-light"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
