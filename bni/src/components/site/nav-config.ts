export const primaryNav = [
  { href: "/", label: "Home" },
  { href: "/members", label: "Members" },
  { href: "/categories", label: "Categories" },
  { href: "/meetings", label: "Meetings" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
