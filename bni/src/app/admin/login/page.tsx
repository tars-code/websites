import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { getChapter } from "@/lib/data";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  const [chapter, admins] = await Promise.all([getChapter(), db().list("admin_users")]);
  const firstRun = admins.length === 0;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-center">{chapter.name}</p>
        <h1 className="display mt-2 text-center text-[2rem]">Admin sign in</h1>
        <div className="mt-8 rounded-lg border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
          <LoginForm />
        </div>
        {firstRun && (
          <p className="mt-5 rounded-md bg-warn-soft px-4 py-3 text-[0.82rem] leading-relaxed text-warn">
            {env.adminEmail
              ? "First sign-in: use the ADMIN_EMAIL and ADMIN_PASSWORD configured on the server. This creates the first admin account."
              : "No admin account exists yet. Set ADMIN_EMAIL and ADMIN_PASSWORD in the server environment, then sign in with them."}
          </p>
        )}
        <p className="mt-6 text-center text-[0.85rem]">
          <Link href="/" className="text-muted hover:text-ink">
            ← Back to website
          </Link>
        </p>
      </div>
    </main>
  );
}
