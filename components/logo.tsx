import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import mark from "@/public/nawehub-mark.png";

const SIZE_MAP = {
  sm: { icon: 24, text: "text-lg" },
  md: { icon: 32, text: "text-xl" },
  lg: { icon: 44, text: "text-3xl" },
} as const;

interface LogoProps {
  size?: keyof typeof SIZE_MAP;
  /** Render just the hexagon mark, no wordmark - for tight spaces (mobile
   * nav, favicons-in-app contexts). */
  markOnly?: boolean;
  className?: string;
  href?: string | null;
}

/**
 * Pairs the NaWeHub hexagon/network-nodes mark with the "NaWeHub" wordmark
 * set live in Fraunces (not a flattened text-in-image lockup), so it stays
 * crisp and theme-aware at every size. The mark itself is a colored PNG (no
 * light/dark variants needed - it already reads fine on both surface
 * colors); only the wordmark text color follows the theme via `currentColor`
 * / `text-foreground`.
 */
export function Logo({ size = "md", markOnly = false, className, href = "/" }: LogoProps) {
  const { icon, text } = SIZE_MAP[size];

  const content = (
    <span className={cn("inline-flex items-center gap-2 select-none", className)}>
      <Image
        src={mark}
        alt="NaWeHub"
        width={icon}
        height={icon}
        priority
        className="shrink-0"
      />
      {!markOnly && (
        <span className={cn("font-display font-semibold tracking-tight text-foreground", text)}>
          NaWeHub
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="NaWeHub home" className="inline-flex">
      {content}
    </Link>
  );
}
