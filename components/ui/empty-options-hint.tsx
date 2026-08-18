import Link from "next/link";

// Drop-in replacement for a <Select> whose options come from another
// resource (teams, fields, players...) when that resource has none yet.
// An empty <select> just shows the placeholder with no way to tell whether
// that's because nothing matches the filters or because nothing exists at
// all — this makes the "go create one first" case explicit.
export function EmptyOptionsHint({ message, href, linkLabel }: { message: string; href: string; linkLabel: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-surface px-3 py-2 text-xs text-muted">
      {message}{" "}
      <Link href={href} className="font-semibold text-primary underline underline-offset-2 hover:text-primary-hover">
        {linkLabel}
      </Link>
    </p>
  );
}
