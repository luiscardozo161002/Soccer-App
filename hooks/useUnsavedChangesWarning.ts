"use client";

import { useEffect } from "react";

// Warns before a browser tab close/refresh while a form has unsaved changes.
// Only covers that native prompt — in-app navigation (closing a modal, the
// Next.js router) is a separate concern and isn't handled here.

// A counter, not a one-shot flag: a save can be in flight for a while (its
// own eventual window.location.reload() isn't the only reload that can
// land during that window — a dev-mode Fast Refresh reload racing the
// pending request was still tripping this). Call at the start of a save
// and again once it settles (success or error), so the warning stays
// suppressed for the save's whole duration but never leaks past it.
let pendingSaves = 0;

export function suppressUnsavedChangesWarningOnce() {
  pendingSaves++;
}

export function resumeUnsavedChangesWarning() {
  pendingSaves = Math.max(0, pendingSaves - 1);
}

export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (pendingSaves > 0) return;
      event.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}
