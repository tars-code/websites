"use client";

import type { Img } from "@/lib/media";
import type { ChapterSettings } from "@/lib/types";
import { saveChapter } from "@/app/admin/_actions/chapter";
import { ActionForm, SubmitButton } from "./action-form";
import { CheckField, ErrorFor, FormSection, SelectField, TextField } from "./fields";
import { ListEditor } from "./list-editor";
import { SinglePhotoField } from "./photo-uploader";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function ChapterForm({ chapter, logo, hero }: { chapter: ChapterSettings; logo: Img | null; hero: Img | null }) {
  const c = chapter;
  return (
    <ActionForm action={saveChapter} className="pb-24">
      <FormSection title="Chapter" description="Name and description used across the site and in search results.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="name" label="Chapter name" required defaultValue={c.name} hint="e.g. BNI Pinnacle" />
          <TextField name="city" label="City / area" defaultValue={c.city} />
        </div>
        <TextField name="tagline" label="Tagline" defaultValue={c.tagline} maxLength={200} hint="One sentence under the chapter name on the homepage." />
        <TextField name="description" label="Description" multiline rows={4} defaultValue={c.description} hint="Used on the About page and for search engines." />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="foundedOn" label="Chapter launched on" type="date" defaultValue={c.foundedOn} optional hint="Shown as “Meeting since <year>”." />
          <TextField name="timezone" label="Timezone" defaultValue={c.timezone} hint="e.g. Asia/Kolkata" />
        </div>
      </FormSection>

      <FormSection title="Images" description="The logo appears in the header; the hero image on the homepage. Without a hero, the latest meetup's cover photo is used.">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <SinglePhotoField name="logoPhotoId" label="Logo" initial={logo} purpose="chapter" hint="Square PNG with transparent background works best." alt={`${c.name} logo`} />
            <ErrorFor name="logoPhotoId" />
          </div>
          <div>
            <SinglePhotoField name="heroPhotoId" label="Hero image" initial={hero} purpose="chapter" shape="wide" hint="A real photo of the chapter, landscape." alt={c.name} />
            <ErrorFor name="heroPhotoId" />
          </div>
        </div>
      </FormSection>

      <FormSection title="Weekly meeting" description="Powers the “Next meeting” panel, calendar invite and visit page.">
        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField name="meetingDay" label="Day" defaultValue={c.meeting.day} options={DAYS.map((d) => ({ value: d, label: d }))} />
          <TextField name="startTime" label="Starts" type="time" required defaultValue={c.meeting.startTime} />
          <TextField name="endTime" label="Ends" type="time" defaultValue={c.meeting.endTime} hint="Leave blank for “onwards”." />
        </div>
        <SelectField
          name="pattern"
          label="Meeting pattern"
          defaultValue={c.meeting.pattern}
          options={[
            { value: "first_in_person", label: "First week of the month in person, other weeks online" },
            { value: "same_every_week", label: "Same format every week" },
          ]}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            name="format"
            label="Format (when the same every week)"
            defaultValue={c.meeting.format}
            options={[
              { value: "in_person", label: "In person" },
              { value: "online", label: "Online" },
              { value: "hybrid", label: "In person & online" },
            ]}
          />
          <TextField name="onlinePlatform" label="Online platform" defaultValue={c.meeting.onlinePlatform} placeholder="Zoom" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="venueName" label="Venue name" defaultValue={c.meeting.venueName} />
          <TextField name="mapUrl" label="Google Maps link" defaultValue={c.meeting.mapUrl} inputMode="url" />
        </div>
        <TextField name="address" label="Address" defaultValue={c.meeting.address} />
        <TextField name="onlineUrl" label="Online meeting link" defaultValue={c.meeting.onlineUrl} inputMode="url" optional hint="Optional. Shown on the Visit page for online meetings — leave blank to share it privately." />
        <TextField name="visitorNote" label="Note for visitors" multiline rows={3} defaultValue={c.meeting.visitorNote} hint="Arrival time, parking, dress code, breakfast fee…" />
      </FormSection>

      <FormSection title="Visitor contact" description="Who visitors talk to. The WhatsApp number powers the WhatsApp buttons across the site.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="contactName" label="Name" defaultValue={c.contact.name} />
          <TextField name="contactRole" label="Role" defaultValue={c.contact.role} placeholder="Visitor Host" />
          <TextField name="contactPhone" label="Phone" type="tel" defaultValue={c.contact.phone} />
          <TextField name="contactWhatsapp" label="WhatsApp number" type="tel" defaultValue={c.contact.whatsapp} hint="With country code, digits only: 919876543210" />
        </div>
        <TextField name="contactEmail" label="Email" type="email" defaultValue={c.contact.email} />
      </FormSection>

      <FormSection title="Links">
        <div>
          <p className="mb-2 text-[0.88rem] font-medium">Social media</p>
          <ListEditor
            name="social"
            initial={c.social}
            fields={[
              { key: "label", label: "Label", placeholder: "Instagram" },
              { key: "url", label: "Link", placeholder: "instagram.com/…" },
            ]}
            addLabel="Add social link"
          />
          <ErrorFor name="social" />
        </div>
        <div>
          <p className="mb-2 text-[0.88rem] font-medium">BNI links</p>
          <ListEditor
            name="bniLinks"
            initial={c.bniLinks}
            fields={[
              { key: "label", label: "Label", placeholder: "BNI Chennai" },
              { key: "url", label: "Link", placeholder: "bnichennai.com" },
            ]}
            addLabel="Add BNI link"
          />
          <ErrorFor name="bniLinks" />
        </div>
      </FormSection>

      <FormSection
        title="Chapter numbers"
        description="Members, categories and visitors are counted automatically. Add other real figures here — e.g. referrals passed this year. Never estimate."
      >
        <ListEditor
          name="customStats"
          initial={c.customStats.map((s) => ({ label: s.label, value: s.value, note: s.note ?? "" }))}
          fields={[
            { key: "value", label: "Number", placeholder: "312" },
            { key: "label", label: "Label", placeholder: "Referrals passed in 2026" },
            { key: "note", label: "Note (optional)", placeholder: "Jan–Sep" },
          ]}
          addLabel="Add a number"
          max={6}
          emptyText="No extra numbers. That's fine — only real figures belong here."
        />
      </FormSection>

      <FormSection title="Page content" description="Text for the homepage, Visit and About pages. Keep it honest and specific.">
        <ContentList label="Why visit? (homepage)" name="whyVisit" initial={c.content.whyVisit} />
        <ContentList label="Typical meeting agenda (visit page)" name="agenda" initial={c.content.agenda} />
        <div>
          <p className="mb-2 text-[0.88rem] font-medium">Who should visit</p>
          <ListEditor name="audience" initial={c.content.audience.map((text) => ({ text }))} fields={[{ key: "text", label: "Item" }]} addLabel="Add item" />
        </div>
        <ContentList label="Visitor FAQs" name="faqs" initial={c.content.faqs} titleLabel="Question" textLabel="Answer" />
        <ContentList label="About page sections" name="about" initial={c.content.about} />
      </FormSection>

      <FormSection title="Privacy & search">
        <CheckField
          name="membersIndexable"
          label="Let search engines index member profiles"
          hint="Turn off if members prefer their profiles not to appear in Google."
          defaultChecked={c.membersIndexable}
        />
      </FormSection>

      <FormSection title="Website credit" description="A small, static credit in the footer for the volunteer who builds and maintains the site.">
        <CheckField name="attrEnabled" label="Show website credit" defaultChecked={c.attribution.enabled} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="attrName" label="Name" defaultValue={c.attribution.name} />
          <TextField name="attrLine" label="Line" defaultValue={c.attribution.line} />
        </div>
        <TextField name="attrServices" label="Services" defaultValue={c.attribution.services.join(", ")} hint="Comma separated." />
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField name="attrUrl" label="Website" defaultValue={c.attribution.url} inputMode="url" />
          <TextField name="attrEmail" label="Email" type="email" defaultValue={c.attribution.email} />
          <TextField name="attrPhone" label="Phone" type="tel" defaultValue={c.attribution.phone} />
        </div>
      </FormSection>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md lg:left-[248px]">
        <div className="mx-auto flex max-w-[1080px] justify-end lg:px-6">
          <SubmitButton variant="accent" size="lg" className="min-w-40">
            Save settings
          </SubmitButton>
        </div>
      </div>
    </ActionForm>
  );
}

function ContentList({
  label,
  name,
  initial,
  titleLabel = "Title",
  textLabel = "Text",
}: {
  label: string;
  name: string;
  initial: { title: string; text: string }[];
  titleLabel?: string;
  textLabel?: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[0.88rem] font-medium">{label}</p>
      <ListEditor
        name={name}
        initial={initial}
        fields={[
          { key: "title", label: titleLabel },
          { key: "text", label: textLabel, multiline: true },
        ]}
        addLabel="Add"
      />
      <ErrorFor name={name} />
    </div>
  );
}
