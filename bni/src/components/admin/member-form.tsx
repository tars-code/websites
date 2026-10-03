"use client";

import type { Img } from "@/lib/media";
import type { Category, Member } from "@/lib/types";
import { saveMember } from "@/app/admin/_actions/members";
import { ActionForm, SubmitButton } from "./action-form";
import { CheckField, ErrorFor, FormSection, SelectField, TextField } from "./fields";
import { ListEditor } from "./list-editor";
import { SinglePhotoField } from "./photo-uploader";

export function MemberForm({
  member,
  categories,
  holders,
  photo,
}: {
  member: Member | null;
  categories: Category[];
  /** categoryId → name of the active member currently holding it */
  holders: Record<string, string>;
  photo: Img | null;
}) {
  const options = [
    { value: "", label: "— No category —" },
    ...categories.map((c) => {
      const holder = holders[c.id];
      const taken = holder && c.id !== member?.categoryId;
      return { value: c.id, label: taken ? `${c.name} (held by ${holder})` : `${c.name}${c.status === "open" ? " · open" : ""}` };
    }),
  ];

  return (
    <ActionForm action={saveMember} className="pb-24">
      {member && <input type="hidden" name="id" value={member.id} />}

      <FormSection title="Profile" description="Shown on the member card and profile page.">
        <SinglePhotoField
          name="photoId"
          label="Profile photo"
          initial={photo}
          purpose="member"
          shape="portrait"
          hint="A clear head-and-shoulders photo works best."
          alt={member?.name}
        />
        <ErrorFor name="photoId" />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="name" label="Full name" required defaultValue={member?.name} />
          <TextField name="businessName" label="Business name" required defaultValue={member?.businessName} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            name="categoryId"
            label="Category"
            defaultValue={member?.categoryId ?? ""}
            options={options}
            hint={
              <>
                Missing? <a href="/admin/categories" className="underline">Add a category</a> first.
              </>
            }
          />
          <TextField name="role" label="Chapter role" defaultValue={member?.role} placeholder="e.g. President" hint="Leave blank for most members. “Launch Ambassador” lists them in a separate section, not as a member." />
        </div>
        <TextField name="headline" label="One-line introduction" defaultValue={member?.headline} maxLength={200} hint="e.g. “Helping families plan for retirement and their children's education.”" />
        <TextField name="about" label="About" multiline rows={5} defaultValue={member?.about} />
        <TextField name="services" label="Services" multiline rows={4} defaultValue={member?.services.join("\n")} hint="One per line." />
        <TextField name="referralTips" label="A good referral for this member is…" multiline rows={3} defaultValue={member?.referralTips} />
      </FormSection>

      <FormSection
        title="Contact"
        description="Phone, WhatsApp and email are private by default. Tick the boxes only if the member wants them published."
      >
        <TextField name="website" label="Website" defaultValue={member?.website} placeholder="example.com" inputMode="url" />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="phone" label="Phone" type="tel" defaultValue={member?.phone} />
          <TextField name="whatsapp" label="WhatsApp number" type="tel" defaultValue={member?.whatsapp} hint="With country code, e.g. 919876543210" />
        </div>
        <TextField name="email" label="Email" type="email" defaultValue={member?.email} />
        <div className="grid gap-3 rounded-md bg-sand/60 p-4">
          <CheckField name="showPhone" label="Show phone & WhatsApp on the website" defaultChecked={member?.showPhone} />
          <CheckField name="showEmail" label="Show email on the website" defaultChecked={member?.showEmail} />
        </div>
        <div>
          <p className="mb-2 text-[0.88rem] font-medium">Social links</p>
          <ListEditor
            name="social"
            initial={member?.social ?? []}
            fields={[
              { key: "label", label: "Label", placeholder: "LinkedIn" },
              { key: "url", label: "Link", placeholder: "linkedin.com/in/…" },
            ]}
            addLabel="Add link"
            max={8}
          />
          <ErrorFor name="social" />
        </div>
      </FormSection>

      <FormSection title="Listing">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="joinedOn" label="Member since" type="date" defaultValue={member?.joinedOn} optional />
          <SelectField
            name="status"
            label="Status"
            defaultValue={member?.status ?? "active"}
            options={[
              { value: "active", label: "Active — shown on website" },
              { value: "archived", label: "Archived — hidden" },
            ]}
          />
        </div>
        <CheckField name="featured" label="Feature on the homepage" hint="Up to 8 members are shown on the homepage; featured ones first." defaultChecked={member?.featured} />
      </FormSection>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-md lg:left-[248px]">
        <div className="mx-auto flex max-w-[1080px] justify-end lg:px-6">
          <SubmitButton variant="accent" size="lg" className="min-w-40">
            {member ? "Save member" : "Add member"}
          </SubmitButton>
        </div>
      </div>
    </ActionForm>
  );
}
