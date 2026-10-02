"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  Grid2x2,
  Home,
  Images,
  Info,
  Menu,
  MessageCircle,
  Users,
  X,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isActive, primaryNav } from "./nav-config";

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {primaryNav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-2 text-[0.92rem] transition-colors",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                {item.label}
                {active && (
                  <span aria-hidden className="absolute inset-x-3 -bottom-[13px] h-0.5 bg-accent" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/members", label: "Members", icon: Users },
  { href: "/meetings", label: "Meetings", icon: CalendarDays },
  { href: "/categories", label: "Categories", icon: Grid2x2 },
] as const;

/**
 * Mobile bottom navigation: the four most-used destinations within thumb reach,
 * plus a "More" sheet. Hidden on desktop.
 */
export function MobileNav({ whatsappHref }: { whatsappHref: string }) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const openSheet = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="grid h-[var(--bottom-nav-h)] grid-cols-5">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1 text-[0.68rem] font-medium",
                    active ? "text-ink" : "text-faint",
                  )}
                >
                  <Icon aria-hidden className={cn("size-[22px]", active && "text-accent")} strokeWidth={active ? 2.2 : 1.8} />
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={openSheet}
              aria-haspopup="dialog"
              aria-expanded={open}
              className="flex h-full w-full flex-col items-center justify-center gap-1 text-[0.68rem] font-medium text-faint"
            >
              <Menu aria-hidden className="size-[22px]" strokeWidth={1.8} />
              More
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        onClick={(e) => e.target === dialogRef.current && close()}
        onToggle={() => setOpen(!!dialogRef.current?.open)}
        aria-label="More"
        className="m-0 mt-auto w-full max-w-none rounded-t-xl bg-paper p-0 text-ink backdrop:bg-black/40 open:animate-rise lg:hidden"
      >
        <div className="px-4 pt-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong" aria-hidden />
          <div className="mb-2 flex items-center justify-between">
            <p className="eyebrow">More</p>
            <button type="button" onClick={close} className="-mr-2 p-2 text-muted" aria-label="Close menu">
              <X className="size-5" />
            </button>
          </div>
          <ul className="divide-y divide-line">
            <SheetLink href="/visit" icon={MapPin} label="Visit our chapter" />
            <SheetLink href="/gallery" icon={Images} label="Photo gallery" />
            <SheetLink href="/about" icon={Info} label="About the chapter" />
            <SheetLink href="/chapter-meeting.ics" icon={CalendarPlus} label="Add weekly meeting to calendar" plain />
            {whatsappHref && (
              <SheetLink href={whatsappHref} icon={MessageCircle} label="Message us on WhatsApp" plain />
            )}
          </ul>
        </div>
      </dialog>
    </>
  );
}

function SheetLink({
  href,
  icon: Icon,
  label,
  plain,
}: {
  href: string;
  icon: typeof Home;
  label: string;
  plain?: boolean;
}) {
  const cls = "flex min-h-14 items-center gap-3 text-[1rem]";
  const content = (
    <>
      <Icon aria-hidden className="size-5 text-muted" />
      {label}
    </>
  );
  return (
    <li>
      {plain ? (
        <a href={href} className={cls} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {content}
        </a>
      ) : (
        <Link href={href} className={cls}>
          {content}
        </Link>
      )}
    </li>
  );
}
