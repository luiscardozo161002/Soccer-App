"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, RotateCw } from "lucide-react";
import { registerRenewalHandler, redirectToLogin } from "@/lib/auth/client-session";
import { Button } from "@/components/ui/button";

const RESPONSE_TIMEOUT_MS = 60_000;

export function SessionExpiryDialog() {
  const [open, setOpen] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const choice = useRef<((value: boolean) => void) | null>(null);

  useEffect(() => {
    return registerRenewalHandler(async () => {
      setOpen(true);
      const continueSession = await new Promise<boolean>((resolve) => {
        const settle = (value: boolean) => {
          clearTimeout(timer);
          choice.current = null;
          resolve(value);
        };
        const timer = setTimeout(() => settle(false), RESPONSE_TIMEOUT_MS);
        choice.current = settle;
      });
      if (!continueSession) {
        await fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => null);
        redirectToLogin();
        return false;
      }

      setRenewing(true);
      try {
        const response = await fetch("/api/v1/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          setOpen(false);
          return true;
        }
      } catch {
        // Network failure leaves the session untrusted.
      } finally {
        setRenewing(false);
      }
      redirectToLogin();
      return false;
    });
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="session-expired-title" aria-describedby="session-expired-description" className="w-full max-w-sm rounded-lg border border-border bg-surface p-6 shadow-2xl">
        <h2 id="session-expired-title" className="text-lg font-semibold text-ink">Tu sesión venció</h2>
        <p id="session-expired-description" className="mt-2 text-sm text-muted">
          ¿Deseas renovar la sesión para continuar? Si no respondes, se cerrará automáticamente.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={renewing} onClick={() => choice.current?.(false)}>
            <LogOut size={16} /> Salir
          </Button>
          <Button type="button" disabled={renewing} onClick={() => choice.current?.(true)}>
            <RotateCw size={16} /> {renewing ? "Renovando..." : "Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
