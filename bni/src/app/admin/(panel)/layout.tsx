import { requireAdmin } from "@/lib/auth";
import { getChapter } from "@/lib/data";
import { db } from "@/lib/db";
import { storageMisconfigured } from "@/lib/env";
import { AdminNav } from "@/components/admin/admin-nav";
import { TarsCard } from "@/components/site/tars-card";
import { logoutAction } from "../_actions/misc";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [chapter, requests] = await Promise.all([getChapter(), db().list("visit_requests", { status: "new" })]);

  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-3 px-4 py-3 lg:block lg:px-5 lg:pt-6 lg:pb-4">
          <div className="min-w-0">
            <p className="truncate text-[0.95rem] font-semibold">{chapter.name}</p>
            <p className="text-[0.75rem] text-muted">Website admin</p>
          </div>
          <a href="/" target="_blank" className="shrink-0 text-[0.82rem] font-medium text-ink-2 underline underline-offset-4 lg:hidden">
            View site
          </a>
        </div>
        <AdminNav newRequests={requests.length} />
        <div className="hidden flex-1 lg:block" />
        <div className="hidden space-y-4 border-t border-line p-4 lg:block">
          <a href="/" target="_blank" className="block text-[0.86rem] font-medium text-ink-2 hover:text-ink">
            View website ↗
          </a>
          <div className="text-[0.8rem] text-muted">
            Signed in as <span className="text-ink-2">{admin.email}</span>
            <form action={logoutAction}>
              <button className="mt-1 font-medium text-ink-2 underline underline-offset-4 hover:text-ink">Sign out</button>
            </form>
          </div>
          {/* Support card — separated from chapter navigation */}
          <TarsCard attribution={{ ...chapter.attribution, line: "Site built & supported by" }} tone="muted" />
        </div>
      </aside>

      <div className="min-w-0">
        {storageMisconfigured && (
          <div role="alert" className="bg-accent px-4 py-3 text-center text-[0.88rem] text-white">
            The database isn&apos;t connected on this deployment, so changes can&apos;t be saved. Add the Supabase
            environment variables (see docs/DEPLOYMENT.md).
          </div>
        )}
        <main className="mx-auto w-full max-w-[1080px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
        <footer className="mx-auto flex max-w-[1080px] items-center justify-between px-4 pb-8 text-[0.8rem] text-muted sm:px-6 lg:hidden">
          <form action={logoutAction}>
            <button className="underline underline-offset-4">Sign out</button>
          </form>
          <span>{admin.email}</span>
        </footer>
      </div>
    </div>
  );
}
