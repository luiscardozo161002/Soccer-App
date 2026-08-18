import Link from "next/link";

// Replaces a <Select> sourced from another resource (teams, fields...) when
// that resource has none yet — an empty <select> gives no clue why.
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
