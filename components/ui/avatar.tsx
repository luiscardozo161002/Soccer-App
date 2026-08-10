"use client";

import { useState } from "react";

export function Avatar({ src, name, size = 32 }: { src: string | null; name: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  if (!src || failed) {
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
