import { getChapter, getImg } from "@/lib/data";
import { ButtonLink } from "@/components/ui/button";
import { Brand } from "./brand";
import { DesktopNav } from "./nav-client";

export async function SiteHeader() {
  const chapter = await getChapter();
  const logo = await getImg(chapter.logoPhotoId, chapter.name);
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/90 backdrop-blur-md supports-[backdrop-filter]:bg-paper/80">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-ink focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <div className="page-x flex h-[var(--header-h)] items-center justify-between gap-6">
        <Brand name={chapter.name} logo={logo} />
        <DesktopNav />
        <div className="flex items-center gap-2">
          <ButtonLink href="/visit" variant="accent" size="sm" className="lg:hidden">
            Visit
          </ButtonLink>
          <ButtonLink href="/visit" variant="accent" size="sm" className="px-4 max-lg:hidden">
            Visit us
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
