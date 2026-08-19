"use client";

import { useEffect, useRef } from "react";

// Warns before a browser tab close/refresh while a form has unsaved changes.
// Only covers that native prompt — in-app navigation (closing a modal, the
// Next.js router) is a separate concern and isn't handled here.
//
// Tracks `isDirty` via a ref (read live inside the listener) instead of
// re-registering the listener on every change, so the returned `dismiss()`
// takes effect immediately — a `setState` right before a same-tick
// `window.location.reload()` wouldn't re-render in time to matter, since
// the caller is about to reload anyway and won't stick around for it.
export function useUnsavedChangesWarning(isDirty: boolean) {
  const isDirtyRef = useRef(isDirty);

  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return;
      event.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Call right before an intentional reload/navigation that follows a
  // successful save, so it isn't mistaken for the user abandoning changes.
  return function dismiss() {
    isDirtyRef.current = false;
  };
}
