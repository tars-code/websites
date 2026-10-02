"use client";

import { CalendarPlus, CheckCircle2, MessageCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { requestVisit } from "@/app/(site)/visit/actions";
import { idleState } from "@/lib/form";
import { formatDateLong } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";

export function VisitForm({
  dates,
  whatsappHref,
}: {
  /** Upcoming meeting dates (YYYY-MM-DD) with an optional note like "in person". */
  dates: { value: string; note: string }[];
  whatsappHref?: string;
}) {
  // Arriving from an open category ("Visit the chapter") pre-fills it.
  const defaultCategory = useSearchParams().get("category")?.slice(0, 80) ?? "";
  const [state, action, pending] = useActionState(requestVisit, idleState);
  // Set after mount (not during render) so server and client HTML match.
  const startedRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (startedRef.current) startedRef.current.value = String(Date.now());
  }, []);
  const v = state.values ?? {};
  const e = state.errors ?? {};

  if (state.status === "success") {
    return (
      <div role="status" className="animate-rise rounded-lg border border-open/25 bg-open-soft/50 p-6 sm:p-8">
        <CheckCircle2 aria-hidden className="size-8 text-open" />
        <h3 className="display mt-4 text-[1.6rem]">
          Thank you{state.data?.name ? `, ${state.data.name}` : ""}!
        </h3>
        <p className="mt-2 text-[0.98rem] leading-relaxed text-ink-2">
          We&apos;ve received your request
          {state.data?.date ? ` for ${formatDateLong(state.data.date, false)}` : ""}. A member of our team will
          contact you shortly to confirm the details.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <a
            href="/chapter-meeting.ics"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 font-medium hover:border-ink"
          >
            <CalendarPlus aria-hidden className="size-4" /> Add to calendar
          </a>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-4 font-medium hover:border-ink"
            >
              <MessageCircle aria-hidden className="size-4" /> Message us on WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-5">
      {/* Spam protection: hidden honeypot + time-to-submit */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Website <input type="text" name="$website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input ref={startedRef} type="hidden" name="$t" defaultValue="" />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" name="name" required error={e.name}>
          <Input name="name" autoComplete="name" required defaultValue={v.name} error={e.name} />
        </Field>
        <Field label="Business name" name="business" required error={e.business}>
          <Input name="business" autoComplete="organization" required defaultValue={v.business} error={e.business} />
        </Field>
      </div>

      <Field
        label="What does your business do?"
        name="category"
        optional
        hint="e.g. Interior design, Tax consulting — helps us check category availability."
        error={e.category}
      >
        <Input name="category" defaultValue={v.category ?? defaultCategory} error={e.category} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone / WhatsApp" name="phone" error={e.phone} hint="Phone or email — whichever you prefer.">
          <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={v.phone} error={e.phone} />
        </Field>
        <Field label="Email" name="email" error={e.email}>
          <Input name="email" type="email" inputMode="email" autoComplete="email" defaultValue={v.email} error={e.email} />
        </Field>
      </div>

      {dates.length > 0 && (
        <Field label="Which meeting would you like to attend?" name="preferredDate" optional error={e.preferredDate}>
          <Select name="preferredDate" defaultValue={v.preferredDate ?? ""} error={e.preferredDate}>
            <option value="">I&apos;m flexible</option>
            {dates.map((d) => (
              <option key={d.value} value={d.value}>
                {formatDateLong(d.value)}
                {d.note && ` (${d.note})`}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Anything you'd like us to know?" name="message" optional error={e.message}>
        <Textarea name="message" rows={3} maxLength={1000} defaultValue={v.message} error={e.message} />
      </Field>

      <FormMessage state={state} />

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
        <Button type="submit" variant="accent" size="lg" disabled={pending} className="sm:min-w-48">
          {pending ? "Sending…" : "Request a visit"}
        </Button>
        <p className="text-[0.8rem] text-muted">
          We only use these details to arrange your visit.
        </p>
      </div>
    </form>
  );
}
