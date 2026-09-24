type RenewalHandler = () => Promise<boolean>;

let handler: RenewalHandler | null = null;
let pending: Promise<boolean> | null = null;

export function registerRenewalHandler(next: RenewalHandler) {
  handler = next;
  return () => {
    if (handler === next) handler = null;
  };
}

export function requestSessionRenewal() {
  if (!pending) {
    pending = (async () => {
      if (!handler) await new Promise((resolve) => setTimeout(resolve, 100));
      return handler ? handler() : false;
    })().finally(() => {
      pending = null;
    });
  }
  return pending;
}

export function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = window.location.pathname.startsWith("/admin")
    ? `?next=${encodeURIComponent(window.location.pathname)}&expired=1`
    : "?expired=1";
  window.location.assign(new URL(`/login${next}`, window.location.origin).toString());
}
