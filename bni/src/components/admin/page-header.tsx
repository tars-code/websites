import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function AdminHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-8">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 text-[0.86rem] text-muted hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" /> {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display text-[1.9rem] sm:text-[2.2rem]">{title}</h1>
          {description && <p className="mt-1.5 max-w-2xl text-[0.94rem] text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}
