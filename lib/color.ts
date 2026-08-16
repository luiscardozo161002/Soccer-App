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

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/**
 * An admin can pick any accent color, including a very dark one — fine as a
 * button fill, but nearly invisible as `text-primary` against a dark-mode
 * background (contrast ratios well under 2:1 measured in practice). Lightens
 * the color just enough to clear a legibility floor for dark surfaces,
 * leaving colors that are already light enough untouched.
 */
export function ensureDarkModeLegible(hex: string, minLuminance = 0.35) {
  let current = hex;
  for (let ratio = 0.05; relativeLuminance(current) < minLuminance && ratio <= 1; ratio += 0.05) {
    current = shade(hex, -ratio);
  }
  return current;
}
