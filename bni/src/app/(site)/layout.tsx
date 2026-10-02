import { chapterWhatsapp } from "@/lib/chapter-text";
import { getChapter } from "@/lib/data";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { MobileNav } from "@/components/site/nav-client";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const chapter = await getChapter();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <MobileNav whatsappHref={chapterWhatsapp(chapter)} />
    </div>
  );
}
