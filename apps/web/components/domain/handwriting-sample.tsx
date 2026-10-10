import type { ReportSampleInk } from "@/lib/domain";
import { cn } from "@/lib/utils";

type HandwritingSampleProps = ReportSampleInk & { className?: string };

/**
 * A child's scratch work on grid paper, set in the handwriting face. It stands in for the real
 * ink snapshot, which will be a signed image URL once the backend exists.
 */
export function HandwritingSample({
  prompt,
  lines,
  altText,
  caption,
  className,
}: HandwritingSampleProps) {
  return (
    <figure className={cn("space-y-3", className)}>
      <p className="text-sm text-muted-foreground">
        Soal: <span className="text-foreground">{prompt}</span>
      </p>
      <div
        role="img"
        aria-label={altText}
        className="rounded-xl border bg-card px-5 py-4"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, transparent 39px, color-mix(in oklab, var(--border) 80%, transparent) 40px)",
          backgroundSize: "100% 40px",
        }}
      >
        {lines.map((line, index) => (
          <p
            key={line}
            aria-hidden
            className={cn(
              "font-hand text-2xl leading-[40px] text-primary",
              index === lines.length - 1 && "font-bold",
            )}
          >
            {line}
          </p>
        ))}
      </div>
      <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}
