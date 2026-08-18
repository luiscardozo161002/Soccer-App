"use client";

import { useEffect } from "react";

// Warns before a browser tab close/refresh while a form has unsaved changes.
// Only covers that native prompt — in-app navigation (closing a modal, the
// Next.js router) is a separate concern and isn't handled here.
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}
