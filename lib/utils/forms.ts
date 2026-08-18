import type { ChangeEvent, KeyboardEvent } from "react";

// Keystroke-level constraints — corrects as the user types instead of only
// flagging invalid on submit.

export function onlyDigits(value: string) {
  return value.replace(/[^0-9]/g, "");
}

// Digits with at most one decimal point, for currency-style amount fields.
export function onlyDecimal(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}

export function sanitizePhone(value: string) {
  return value.replace(/[^\d+\-()\s]/g, "");
}

export function onlyHexColor(value: string) {
  const digits = value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return digits ? `#${digits}` : "";
}

// Blocks keystrokes (e, +, -, .) that type="number" accepts but don't make
// sense for the positive integers this is used on (matchday, quantities).
export function blockNonIntegerKeys(e: KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-", "."].includes(e.key)) {
    e.preventDefault();
  }
}

// Sanitizes the DOM value before react-hook-form sees it, so invalid
// characters never flash into the field's state for a render.
export function withSanitizer<T extends { onChange: (e: ChangeEvent<HTMLInputElement>) => void }>(
  registration: T,
  sanitize: (value: string) => string
): T {
  return {
    ...registration,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      e.target.value = sanitize(e.target.value);
      return registration.onChange(e);
    },
  };
}
