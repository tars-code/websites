"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Grid2x2, Images, Inbox, LayoutDashboard, Settings, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/meetups", label: "Meetups & events", icon: CalendarDays },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: Grid2x2 },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/requests", label: "Visit requests", icon: Inbox },
  { href: "/admin/chapter", label: "Chapter settings", icon: Settings },
  { href: "/admin/account", label: "Admins & password", icon: ShieldCheck },
];

export function AdminNav({ newRequests }: { newRequests: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="scroll-rail overflow-x-auto px-2 pb-2 lg:overflow-visible lg:px-3">
      <ul className="flex gap-1 lg:flex-col">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-md px-3 text-[0.9rem] whitespace-nowrap transition-colors",
                  active ? "bg-ink text-white" : "text-ink-2 hover:bg-sand",
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {label}
                {href === "/admin/requests" && newRequests > 0 && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 text-[0.72rem] font-semibold tabular-nums",
                      active ? "bg-white text-ink" : "bg-accent text-white",
                    )}
                  >
                    {newRequests}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
