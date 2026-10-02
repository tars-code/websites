import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "light" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-150 select-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-2",
  accent: "bg-accent text-white hover:bg-accent-ink",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink",
  ghost: "text-ink hover:bg-sand",
  light: "bg-white text-ink hover:bg-sand",
  danger: "border border-accent/30 bg-surface text-accent-ink hover:bg-accent-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-md px-3 text-sm",
  md: "h-11 rounded-md px-4 text-[0.94rem]",
  lg: "h-12 rounded-md px-5 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant,
  size,
  className,
  ...props
}: CommonProps & ComponentProps<"button">) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  href,
  external,
  ...props
}: CommonProps & { href: string; external?: boolean } & Omit<ComponentProps<"a">, "href">) {
  const cls = buttonClass(variant, size, className);
  if (external || /^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a
        href={href}
        className={cls}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...props}
      />
    );
  }
  return <Link href={href} className={cls} {...props} />;
}
