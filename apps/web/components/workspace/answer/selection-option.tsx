import { Check } from "lucide-react";

import type { WorkspaceOption } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface SelectionOptionProps {
  type: "radio" | "checkbox";
  name: string;
  option: WorkspaceOption;
  checked: boolean;
  onChange: () => void;
}

export function SelectionOption({ type, name, option, checked, onChange }: SelectionOptionProps) {
  return (
    <label className="relative block min-w-0 cursor-pointer touch-manipulation">
      <input
        type={type}
        name={name}
        value={option.id}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-xl border bg-background transition-colors duration-200",
          "peer-focus-visible:ring-3 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          checked
            ? "border-primary bg-secondary/70 ring-1 ring-primary/30"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
        )}
      />
      <span className="relative flex min-h-touch items-center gap-3 px-3 py-2.5 text-left">
        <span
          aria-hidden
          className={cn(
            "grid size-7 shrink-0 place-items-center border text-xs font-bold transition-colors duration-200",
            type === "radio" ? "rounded-full" : "rounded-md",
            checked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-card text-muted-foreground",
          )}
        >
          {checked ? (
            type === "radio" ? (
              <span className="size-2.5 rounded-full bg-primary-foreground" />
            ) : (
              <Check className="size-4 stroke-[3]" />
            )
          ) : (
            option.label
          )}
        </span>
        <span className="min-w-0 flex-1 text-base leading-snug font-medium">{option.text}</span>
      </span>
    </label>
  );
}
