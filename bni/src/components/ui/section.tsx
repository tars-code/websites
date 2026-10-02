import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  id,
  className,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  id?: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <Heading id={id} className="display text-[1.75rem] text-ink sm:text-[2.15rem]">
          {title}
        </Heading>
        {description && <p className="mt-3 text-[0.98rem] leading-relaxed text-muted">{description}</p>}
      </div>
      {action && <ArrowLink href={action.href}>{action.label}</ArrowLink>}
    </div>
  );
}

export function ArrowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex shrink-0 items-center gap-1.5 py-2 text-[0.94rem] font-medium text-ink",
        className,
      )}
    >
      <span className="link-underline">{children}</span>
      <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function PageIntro({
  eyebrow,
  title,
  children,
  aside,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="page-x flex flex-col gap-6 pt-10 pb-8 sm:pt-14 sm:pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl animate-rise">
          {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
          <h1 className="display text-[2.1rem] sm:text-[2.75rem]">{title}</h1>
          {children && <div className="mt-4 text-[1.02rem] leading-relaxed text-muted">{children}</div>}
        </div>
        {aside}
      </div>
    </header>
  );
}
