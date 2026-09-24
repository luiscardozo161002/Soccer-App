import Link from "next/link";

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
