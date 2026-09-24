export function BallGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="0.6">
      <circle cx="50" cy="50" r="48" />
      <polygon points="50,24 63,33 58,48 42,48 37,33" fill="currentColor" stroke="none" />
      <path d="M50 24 L50 6 M63 33 L80 26 M58 48 L70 62 M42 48 L30 62 M37 33 L20 26" />
      <path d="M50 6 L80 26 M80 26 L70 62 M70 62 L30 62 M30 62 L20 26 M20 26 L50 6" />
    </svg>
  );
}

export function JerseyGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="0.6">
      <path d="M36 4 L18 18 L28 34 L34 28 V92 H66 V28 L72 34 L82 18 L64 4 C64 12 57 17 50 17 C43 17 36 12 36 4 Z" />
      <circle cx="50" cy="46" r="9" opacity="0.7" />
    </svg>
  );
}

export function GoalGlyph({ className }: { className?: string }) {
  const verticals = [30, 52, 74, 96];
  const horizontals = [35, 50, 65];
  return (
    <svg viewBox="0 0 140 90" className={className} fill="none" stroke="currentColor" strokeWidth="0.6">
      <path d="M15 88 V20 L30 6 H110 L125 20 V88" />
      <line x1="15" y1="20" x2="125" y2="20" opacity="0.6" />
      {verticals.map((x) => (
        <line key={x} x1={x} y1="20" x2={x} y2="88" opacity="0.4" />
      ))}
      {horizontals.map((y) => (
        <line key={y} x1="15" y1={y} x2="125" y2={y} opacity="0.4" />
      ))}
    </svg>
  );
}

export function CornerFlagGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 70" className={className} fill="none" stroke="currentColor" strokeWidth="1">
      <line x1="6" y1="68" x2="6" y2="4" />
      <path d="M6 4 L34 14 L6 24 Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
