"use client";

import { ChevronDown, ExternalLink, MessageCircle } from "lucide-react";
import type { ChapterEvent, EventKind } from "@/lib/types";
import type { Img } from "@/lib/media";
import { eventKindLabels } from "@/lib/chapter-text";
import { ActionForm, SubmitButton, useFormResult } from "./action-form";
import { FormSection, SelectField, TextField } from "./fields";
import { MeetupPhotoUploader } from "./photo-uploader";
import { saveEvent } from "@/app/admin/_actions/events";

export function MeetupForm({
  event,
  defaults,
  images,
  siteUrl,
  defaultVenue,
}: {
  event: ChapterEvent | null;
  defaults: { kind: EventKind; date: string; title: string };
  images: Img[];
  siteUrl: string;
  defaultVenue: string;
}) {
  const isWeekly = (event?.kind ?? defaults.kind) === "weekly_meeting";
  const published = event?.status === "published";
  const lines = (list?: string[]) => (list ?? []).join("\n");

  return (
    <ActionForm action={saveEvent} className="pb-28">
      {event && <input type="hidden" name="id" value={event.id} />}

      {published && <SharePanel url={`${siteUrl}/meetings/${event.slug}`} title={event.title} />}

      <FormSection title="The basics" description="What happened and when. The short description appears on the homepage.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="date" label="Date" type="date" required defaultValue={event?.date ?? defaults.date} />
          <SelectField
            name="kind"
            label="Type"
            defaultValue={event?.kind ?? defaults.kind}
            options={Object.entries(eventKindLabels).map(([value, label]) => ({ value, label }))}
          />
        </div>
        <TextField name="title" label="Title" required defaultValue={event?.title ?? defaults.title} maxLength={120} />
        <TextField
          name="summary"
          label="Short description"
          multiline
          rows={3}
          maxLength={600}
          defaultValue={event?.summary}
          hint="One to three sentences. e.g. “A full room this week with three visitors and a feature presentation on…”"
        />
      </FormSection>

      <FormSection title="Photos" description="Upload as many as you like. The starred photo is the cover — it's what people see when the link is shared.">
        <MeetupPhotoUploader initial={images} initialCover={event?.coverPhotoId ?? null} altPrefix={event?.title ?? defaults.title} />
      </FormSection>

      <FormSection
        title="Numbers"
        description="Optional. Only numbers you fill in are shown on the website — leave blank if you're not sure."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <TextField name="membersPresent" label="Members present" inputMode="numeric" defaultValue={event?.stats.membersPresent} />
          <TextField name="visitorsCount" label="Visitors" inputMode="numeric" defaultValue={event?.stats.visitors} />
          <TextField name="referrals" label="Referrals passed" inputMode="numeric" defaultValue={event?.stats.referrals} />
          <TextField name="newMembersCount" label="New members" inputMode="numeric" defaultValue={event?.stats.newMembers} />
          <TextField name="oneToOnes" label="One-to-ones" inputMode="numeric" defaultValue={event?.stats.oneToOnes} />
          <TextField name="businessValue" label="Business thanked" placeholder="e.g. ₹4.2L" defaultValue={event?.stats.businessValue} />
        </div>
      </FormSection>

      <FormSection title="Highlights" description="Optional. One item per line. Keep them short.">
        <TextField
          name="highlights"
          label="Highlights"
          multiline
          rows={4}
          defaultValue={lines(event?.highlights)}
          placeholder={"Feature presentation by …\nEducation moment on …"}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="visitors"
            label="Visitors"
            multiline
            rows={3}
            defaultValue={(event?.visitors ?? []).map((v) => (v.business ? `${v.name} — ${v.business}` : v.name)).join("\n")}
            placeholder="Name — Business"
            hint="Only add names visitors are happy to have shown publicly."
          />
          <TextField name="newMembers" label="New members welcomed" multiline rows={3} defaultValue={lines(event?.newMembers)} />
          <TextField name="celebrations" label="Celebrations" multiline rows={3} defaultValue={lines(event?.celebrations)} placeholder="Birthdays, anniversaries…" />
          <TextField name="achievements" label="Member achievements" multiline rows={3} defaultValue={lines(event?.achievements)} />
        </div>
        <TextField name="spotlight" label="Member spotlight" multiline rows={2} defaultValue={event?.spotlight} />
        <TextField name="announcements" label="Announcements" multiline rows={3} defaultValue={lines(event?.announcements)} />
      </FormSection>

      <details className="group border-t border-line py-6" open={!isWeekly}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block font-semibold">More details</span>
            <span className="text-[0.86rem] text-muted">Time, location, longer write-up and visitor information.</span>
          </span>
          <ChevronDown aria-hidden className="size-5 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-6 grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField name="startTime" label="Start time" type="time" defaultValue={event?.startTime} hint="Blank = regular meeting time" />
            <TextField name="endTime" label="End time" type="time" defaultValue={event?.endTime} />
          </div>
          <TextField name="location" label="Location" defaultValue={event?.location} hint={`Blank = ${defaultVenue}`} />
          <TextField name="body" label="Full write-up" multiline rows={6} defaultValue={event?.body} />
          <TextField
            name="visitorInfo"
            label="Information for visitors"
            multiline
            rows={3}
            defaultValue={event?.visitorInfo}
            hint="Shown on upcoming events, e.g. “Breakfast included. Please confirm by Thursday.”"
          />
        </div>
      </details>

      <ActionBar isNew={!event} published={published} />
    </ActionForm>
  );
}

function ActionBar({ isNew, published }: { isNew: boolean; published: boolean }) {
  const state = useFormResult();
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md lg:left-[248px]">
      <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-end gap-2 sm:px-2 lg:px-6">
        {state.status === "error" && (
          <p className="mr-auto text-[0.84rem] text-accent-ink">Please fix the highlighted fields.</p>
        )}
        {published ? (
          <>
            <SubmitButton name="intent" value="unpublish" variant="ghost" pendingText="Unpublishing…">
              Unpublish
            </SubmitButton>
            <SubmitButton name="intent" value="publish" variant="accent" size="lg" pendingText="Saving…">
              Save changes
            </SubmitButton>
          </>
        ) : (
          <>
            <SubmitButton name="intent" value="draft" variant="secondary" pendingText="Saving…">
              Save draft
            </SubmitButton>
            <SubmitButton name="intent" value="publish" variant="accent" size="lg" pendingText="Publishing…" className="min-w-44">
              {isNew ? "Publish meetup" : "Publish"}
            </SubmitButton>
          </>
        )}
      </div>
    </div>
  );
}

function SharePanel({ url, title }: { url: string; title: string }) {
  return (
    <div className="mb-8 flex flex-col gap-3 rounded-lg border border-open/25 bg-open-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[0.9rem] font-semibold text-open">Live on the website</p>
        <p className="truncate text-[0.84rem] text-muted">{url}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Photos from our ${title} 👇\n${url}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-open px-3 text-[0.86rem] font-medium text-white"
        >
          <MessageCircle aria-hidden className="size-4" /> Share on WhatsApp
        </a>
        <a href={url} target="_blank" className="inline-flex h-9 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-[0.86rem] font-medium">
          View <ExternalLink aria-hidden className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
