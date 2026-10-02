import Link from "next/link";
import { Inbox, Mail, MessageCircle, Phone } from "lucide-react";
import { getChapter } from "@/lib/data";
import { db } from "@/lib/db";
import { formatDateLong, formatRelativeTimestamp } from "@/lib/dates";
import type { VisitRequestStatus } from "@/lib/types";
import { cn, telLink, whatsappLink } from "@/lib/utils";
import { EmptyState } from "@/components/ui/states";
import { ConfirmAction } from "@/components/admin/action-form";
import { AdminHeader } from "@/components/admin/page-header";
import { RequestNotes, RequestStatusSelect } from "@/components/admin/request-controls";
import { deleteVisitRequest } from "../../_actions/misc";

const tabs: { key: VisitRequestStatus | "all"; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "visited", label: "Visited" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];

export default async function RequestsAdmin({ searchParams }: PageProps<"/admin/requests">) {
  const sp = await searchParams;
  const tab = (tabs.find((t) => t.key === sp.status)?.key ?? "new") as VisitRequestStatus | "all";
  const [requests, chapter] = await Promise.all([db().list("visit_requests"), getChapter()]);
  const sorted = requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const list = tab === "all" ? sorted : sorted.filter((r) => r.status === tab);
  const count = (k: string) => (k === "all" ? requests.length : requests.filter((r) => r.status === k).length);

  return (
    <>
      <AdminHeader
        title="Visit requests"
        description="People who asked to visit through the website. Reach out within a day — it makes a big difference."
      />

      <nav aria-label="Filter" className="scroll-rail mb-5 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/requests?status=${t.key}`}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-[0.86rem] font-medium",
              tab === t.key ? "bg-ink text-white" : "text-muted hover:bg-sand hover:text-ink",
            )}
          >
            {t.label} <span className="opacity-70">{count(t.key)}</span>
          </Link>
        ))}
      </nav>

      {list.length === 0 ? (
        <EmptyState icon={Inbox} title={tab === "new" ? "No new requests" : "Nothing here"}>
          {tab === "new" && "When someone fills in the form on the Visit page, it appears here."}
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {list.map((r) => {
            const wa = whatsappLink(
              r.phone,
              `Hi ${r.name.split(" ")[0]}, thanks for your interest in visiting ${chapter.name}!`,
            );
            return (
              <li key={r.id} className="rounded-lg border border-line bg-surface p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {r.name}
                      {r.business && <span className="font-normal text-muted"> · {r.business}</span>}
                    </p>
                    <p className="mt-0.5 text-[0.84rem] text-muted">
                      {r.category && <>Category: {r.category} · </>}
                      {r.preferredDate ? `Wants to attend ${formatDateLong(r.preferredDate, false)}` : "Flexible date"} ·{" "}
                      {formatRelativeTimestamp(r.createdAt)}
                    </p>
                  </div>
                  <RequestStatusSelect id={r.id} status={r.status} />
                </div>
                {r.message && <p className="mt-3 rounded-md bg-paper px-3 py-2 text-[0.9rem] text-ink-2">{r.message}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.phone && (
                    <a href={telLink(r.phone)} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line-strong px-3 text-[0.86rem] font-medium hover:border-ink">
                      <Phone aria-hidden className="size-4" /> {r.phone}
                    </a>
                  )}
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line-strong px-3 text-[0.86rem] font-medium hover:border-ink">
                      <MessageCircle aria-hidden className="size-4" /> WhatsApp
                    </a>
                  )}
                  {r.email && (
                    <a href={`mailto:${r.email}`} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line-strong px-3 text-[0.86rem] font-medium hover:border-ink">
                      <Mail aria-hidden className="size-4" /> {r.email}
                    </a>
                  )}
                </div>
                <div className="mt-3">
                  <RequestNotes id={r.id} status={r.status} initial={r.notes} />
                </div>
                <div className="mt-2 text-right">
                  <ConfirmAction
                    action={deleteVisitRequest}
                    fields={{ id: r.id }}
                    confirmText={`Delete the request from ${r.name}? This removes their details permanently.`}
                    successMessage="Request deleted."
                    className="text-[0.8rem] text-muted hover:text-accent-ink"
                  >
                    Delete
                  </ConfirmAction>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
