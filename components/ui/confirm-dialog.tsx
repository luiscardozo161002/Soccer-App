"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
};

export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    setOptions(null);
    resolver.current?.(result);
    resolver.current = null;
  };

  const dialog = (
    <Modal open={options !== null} onClose={() => close(false)} title={options?.title ?? ""}>
      {options?.description && <p className="text-sm text-muted">{options.description}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={() => close(false)}>
          {options?.cancelLabel ?? "Cancelar"}
        </Button>
        <Button variant={options?.tone === "primary" ? "primary" : "danger"} onClick={() => close(true)}>
          {options?.confirmLabel ?? "Eliminar"}
        </Button>
      </div>
    </Modal>
  );

  return { confirm, dialog };
}
