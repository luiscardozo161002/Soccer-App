import type { ChangeEvent, KeyboardEvent } from "react";

// Keystroke-level input constraints, not just a post-submit validation
// message — the field is corrected as the user types instead of only being
// flagged invalid afterwards.

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

// For native type="number" inputs: blocks keystrokes that the browser
// otherwise accepts (e, +, -, .) but that don't make sense for the whole
// positive integers we use this on (matchday, quantities), instead of
// letting them through and only rejecting the value on submit.
export function blockNonIntegerKeys(e: KeyboardEvent<HTMLInputElement>) {
  if (["e", "E", "+", "-", "."].includes(e.key)) {
    e.preventDefault();
  }
}

// Wraps a react-hook-form `register(...)` result (or a `Controller` field)
// so the DOM value is sanitized before react-hook-form ever sees it —
// otherwise invalid characters would flash into the field's state for a
// render before validation catches them.
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
