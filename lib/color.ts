function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }) {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, "0")).join("")}`;
}

/** Mixes `hex` toward black (ratio > 0) or white (ratio < 0). */
export function shade(hex: string, ratio: number) {
  const { r, g, b } = hexToRgb(hex);
  const target = ratio >= 0 ? 0 : 255;
  const amount = Math.abs(ratio);
  return toHex({
    r: r + (target - r) * amount,
    g: g + (target - g) * amount,
    b: b + (target - b) * amount,
  });
}

export function hexToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
