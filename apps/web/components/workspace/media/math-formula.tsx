import katex from "katex";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface MathFormulaProps extends HTMLAttributes<HTMLSpanElement> {
  formula: string;
  displayMode?: boolean;
  inline?: boolean;
}

/**
 * MathFormula renders math expressions with KaTeX 0.19.
 * Fallback to raw formula string if parsing fails to avoid runtime crashes.
 */
export function MathFormula({
  formula,
  displayMode = false,
  inline = false,
  className,
  ...props
}: MathFormulaProps) {
  const isDisplay = displayMode && !inline;

  const html = (() => {
    try {
      return katex.renderToString(formula, {
        displayMode: isDisplay,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return null;
    }
  })();

  if (!html) {
    return (
      <span
        className={cn("font-mono text-xs", isDisplay && "my-1 block text-center", className)}
        {...props}
      >
        {formula}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-block align-middle select-text",
        isDisplay && "my-2 block w-full overflow-x-auto text-center py-1",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
      {...props}
    />
  );
}
