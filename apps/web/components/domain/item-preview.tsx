"use client";

import { useEffect, useRef, useState } from "react";

import { previewScale, previewSizes, type PreviewSize } from "@/lib/item-preview";
import { cn } from "@/lib/utils";

/**
 * The workspace shown at the three real screen sizes. Each size is an iframe at full resolution,
 * scaled down to fit, so media queries behave exactly as on that device.
 */
export function ItemPreview({ previewSrc }: { previewSrc: string }) {
  const [sizeId, setSizeId] = useState<PreviewSize["id"]>("landscape");
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) =>
      setContainerWidth(entry?.contentRect.width ?? 0),
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const size = previewSizes.find((item) => item.id === sizeId) ?? previewSizes[0];
  const scale = previewScale(containerWidth, size.width);

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Ukuran layar pratinjau" className="flex flex-wrap gap-2">
        {previewSizes.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={item.id === sizeId}
            onClick={() => setSizeId(item.id)}
            className={cn(
              "inline-flex min-h-touch items-center gap-2 rounded-lg border px-3 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring",
              item.id === sizeId
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent",
            )}
          >
            {item.label}
            <span className="text-xs tabular-nums opacity-80">
              {item.width}×{item.height}
            </span>
          </button>
        ))}
      </div>

      <div ref={containerRef} className="w-full">
        <div
          className="mx-auto overflow-hidden rounded-xl border bg-muted/30 shadow-sm"
          style={{ width: size.width * scale, height: size.height * scale }}
        >
          <iframe
            key={size.id}
            title={`Pratinjau ruang kerja, ${size.label}`}
            src={previewSrc}
            width={size.width}
            height={size.height}
            className="block origin-top-left border-0"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Tampilan {size.label.toLowerCase()} ({size.width}×{size.height}) diperkecil{" "}
        {Math.round(scale * 100)}% agar muat. Pratinjau memakai versi butir yang tersimpan, bukan
        perubahan di formulir.
      </p>
    </div>
  );
}
