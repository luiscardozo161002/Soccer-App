"use client";

import { useEffect, useState } from "react";

export function Avatar({ src, name, size = 26 }: { src: string | null; name: string; size?: number }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(src ? "loading" : "error");

  // Re-sync on a changed src without remounting (e.g. photo just uploaded).
  useEffect(() => {
    setStatus(src ? "loading" : "error");
  }, [src]);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  if (!src || status === "error") {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
      >
        {initials || "?"}
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size }} className="relative shrink-0 overflow-hidden rounded-full">
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse rounded-full bg-current/10" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        className={`h-full w-full rounded-full object-contain transition-opacity duration-300 ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </div>
  );
}
