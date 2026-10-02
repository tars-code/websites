import { getChapter, getImg } from "@/lib/data";
import { ChapterForm } from "@/components/admin/chapter-form";
import { AdminHeader } from "@/components/admin/page-header";

export default async function ChapterSettingsPage() {
  const chapter = await getChapter();
  const [logo, hero] = await Promise.all([getImg(chapter.logoPhotoId), getImg(chapter.heroPhotoId)]);
  return (
    <>
      <AdminHeader
        title="Chapter settings"
        description="Everything about the chapter in one place. Changes appear on the website as soon as you save."
      />
      <ChapterForm chapter={chapter} logo={logo} hero={hero} />
    </>
  );
}
