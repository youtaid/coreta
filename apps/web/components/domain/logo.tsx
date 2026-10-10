import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type LogoVariant = "horizontal" | "icon" | "stacked" | "tagline";
export type LogoSize = "sm" | "md" | "lg" | "xl";

export interface LogoProps {
  variant?: LogoVariant;
  size?: LogoSize;
  href?: string;
  className?: string;
  priority?: boolean;
  alt?: string;
}

const sizeConfig: Record<
  LogoVariant,
  Record<LogoSize, { width: number; height: number; imgClass: string }>
> = {
  horizontal: {
    sm: { width: 102, height: 24, imgClass: "h-6 w-auto" },
    md: { width: 136, height: 32, imgClass: "h-8 w-auto" },
    lg: { width: 170, height: 40, imgClass: "h-10 w-auto" },
    xl: { width: 204, height: 48, imgClass: "h-12 w-auto" },
  },
  tagline: {
    sm: { width: 106, height: 28, imgClass: "h-7 w-auto" },
    md: { width: 137, height: 36, imgClass: "h-9 w-auto" },
    lg: { width: 182, height: 48, imgClass: "h-12 w-auto" },
    xl: { width: 228, height: 60, imgClass: "h-15 w-auto" },
  },
  stacked: {
    sm: { width: 64, height: 59, imgClass: "w-16 h-auto" },
    md: { width: 96, height: 88, imgClass: "w-24 h-auto" },
    lg: { width: 128, height: 117, imgClass: "w-32 h-auto" },
    xl: { width: 160, height: 146, imgClass: "w-40 h-auto" },
  },
  icon: {
    sm: { width: 24, height: 24, imgClass: "size-6" },
    md: { width: 32, height: 32, imgClass: "size-8" },
    lg: { width: 40, height: 40, imgClass: "size-10" },
    xl: { width: 48, height: 48, imgClass: "size-12" },
  },
};

/**
 * Official Coreta Logo component.
 * Automatically adapts between Light and Dark themes via CSS classes
 * to prevent hydration mismatches and ensure instant, zero-flicker rendering.
 */
export function Logo({
  variant = "horizontal",
  size = "md",
  href,
  className,
  priority = false,
  alt = "Coreta",
}: LogoProps) {
  const cfg = sizeConfig[variant][size];

  const content = (() => {
    if (variant === "icon") {
      return (
        <Image
          src="/images/coreta-ikon-aplikasi-centang-1024.png"
          alt={alt}
          width={cfg.width}
          height={cfg.height}
          priority={priority}
          className={cn("rounded-lg object-contain", cfg.imgClass)}
        />
      );
    }

    if (variant === "tagline") {
      return (
        <>
          <Image
            src="/images/coreta-horizontal-tagline-warna.png"
            alt={alt}
            width={cfg.width}
            height={cfg.height}
            priority={priority}
            className={cn("block object-contain dark:hidden", cfg.imgClass)}
          />
          <Image
            src="/images/coreta-horizontal-tagline-gelap.png"
            alt={alt}
            width={cfg.width}
            height={cfg.height}
            priority={priority}
            className={cn("hidden object-contain dark:block", cfg.imgClass)}
          />
        </>
      );
    }

    if (variant === "stacked") {
      return (
        <>
          <Image
            src="/images/coreta-bertumpuk-warna.png"
            alt={alt}
            width={cfg.width}
            height={cfg.height}
            priority={priority}
            className={cn("block object-contain dark:hidden", cfg.imgClass)}
          />
          <Image
            src="/images/coreta-bertumpuk-gelap.png"
            alt={alt}
            width={cfg.width}
            height={cfg.height}
            priority={priority}
            className={cn("hidden object-contain dark:block", cfg.imgClass)}
          />
        </>
      );
    }

    // Default: "horizontal"
    return (
      <>
        <Image
          src="/images/coreta-horizontal-warna.png"
          alt={alt}
          width={cfg.width}
          height={cfg.height}
          priority={priority}
          className={cn("block object-contain dark:hidden", cfg.imgClass)}
        />
        <Image
          src="/images/coreta-horizontal-gelap.png"
          alt={alt}
          width={cfg.width}
          height={cfg.height}
          priority={priority}
          className={cn("hidden object-contain dark:block", cfg.imgClass)}
        />
      </>
    );
  })();

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          "inline-flex min-h-touch items-center transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring rounded-lg",
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={cn("inline-flex items-center", className)}>{content}</div>;
}
