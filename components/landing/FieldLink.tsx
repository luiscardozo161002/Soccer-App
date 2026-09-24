import { ExternalLink } from "lucide-react";
import { googleMapsUrl } from "@/modules/fields/hooks/useFields";

export function FieldLink({ location, name }: { location: string | null | undefined; name: string }) {
  if (!location) return <span>{name}</span>;
  return (
    <a
      href={googleMapsUrl(location)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:text-primary "
    >
      {name}
      <ExternalLink size={11} />
    </a>
  );
}
