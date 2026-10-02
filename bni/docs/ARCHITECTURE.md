# Chapter Website — Architecture & Decisions

This document is the "first deliverable": the plan the code follows. Keep it
up to date when decisions change.

## 1. Recommended architecture

| Concern            | Choice                                                     | Why |
|--------------------|------------------------------------------------------------|-----|
| Framework          | Next.js 16 (App Router), TypeScript, React Server Components | SSR/ISR for SEO + speed, one codebase for site, admin and API |
| Styling            | Tailwind CSS v4 + a small in-house component set           | No heavy UI kit; consistent design tokens in `globals.css` |
| Database           | **Supabase Postgres** (free tier) in production            | Real relational DB, generous free tier, no server to run |
| Photo storage      | **Supabase Storage** public bucket                          | Same project, CDN-backed, free tier 1 GB |
| Local development  | JSON file + local disk adapter (`.data/`)                  | Clone → `npm run seed` → working site, no accounts needed |
| Auth (admin)       | Own email + password (scrypt) with HMAC-signed cookie      | No extra service, works with either storage adapter |
| Image pipeline     | Resize **once at upload** (browser downscale → `sharp` variants 480/960/1600 webp + blur placeholder) | Visitors never download originals; no paid image-CDN quota; EXIF/GPS stripped |
| Hosting            | Vercel Hobby (free)                                         | Zero-config Next.js, HTTPS, CDN |
| Email/notifications| Optional: generic webhook and/or Resend (free tier)         | Off by default; visit requests are always stored in the DB |

**Cost at launch: ₹0.** Vercel Hobby + Supabase Free. Nothing paid is required.

### Data access

All reads/writes go through `src/lib/db/` — a tiny repository interface with two
adapters (`local` and `supabase`). The adapter is picked by environment: if
`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set, Supabase is used; otherwise
the local JSON store. Data volumes for a chapter are small (tens of members,
hundreds of photos), so filtering/sorting happens in TypeScript after simple
indexed queries — the adapters stay trivial and swappable.

The Supabase service-role key is **server-only**. Tables have Row Level Security
enabled with *no* public policies, so the anon key (never used) can read nothing.

### Rendering & caching

Public pages are statically rendered and cached (ISR, `revalidate = 600`). Every
admin mutation calls `revalidatePath('/', 'layout')`, so a published meetup shows
on the homepage immediately. Members search/filter happens client-side on
already-rendered data — no extra requests.

## 2. Site structure

```
/                    Home — hero, next meeting, snapshot, latest meetup, members, categories, why visit, events, CTA
/members             Directory with search + category filter + sort
/members/[slug]      Member profile
/categories          All categories, filled vs open, search/filter
/meetings            Upcoming events + past meetups
/meetings/[slug]     Meetup/event detail: photos, highlights, stats, share
/gallery             Photos grouped by meetup/event, lightbox
/visit               Visit our chapter: when/where/agenda/FAQ + request form + WhatsApp
/about               Chapter purpose, how it works, leadership
/chapter-meeting.ics Recurring calendar invite for the weekly meeting
/admin/*             Protected admin (dashboard, meetups, members, categories, gallery, visit requests, chapter settings, admins)
```

## 3. Data model

```
ChapterSettings (single row)  name, tagline, description, city, timezone,
                              meeting{day,start,end,format,venue,address,mapUrl,onlineUrl},
                              contact{name,role,phone,email,whatsapp}, social[], bniLinks,
                              logoPhotoId, heroPhotoId, foundedOn, customStats[],
                              content{whyVisit[], agenda[], faqs[], about[], audience[]},
                              memberContactPolicy, attribution{…Tars…}

Category        id, name, slug, group, description, status(open|filled), priority(bool), sortOrder
Member          id, slug, name, businessName, categoryId → Category, role, headline, about,
                services[], referralTips, website, phone, email, whatsapp, social{},
                showPhone, showEmail, photoId → Photo, joinedOn, featured, status(active|archived)
Event           id, slug, kind(weekly_meeting|event|social|training|visitor_day), status(draft|published|archived),
                title, date, startTime, endTime, location, summary, body, visitorInfo,
                coverPhotoId → Photo, stats{membersPresent,visitors,referrals,newMembers,…},
                highlights[], celebrations[], announcements[], spotlight, visitors[{name,business}], newMembers[]
Photo           id, purpose(gallery|member|chapter), eventId → Event?, width, height, widths[],
                blurDataUrl, alt, caption, sortOrder
VisitRequest    id, name, business, category, phone, email, preferredDate, message,
                status(new|contacted|visited|closed), notes
AdminUser       id, email, name, passwordHash, lastLoginAt
```

"Meeting" and "Event" share one table (`events`) distinguished by `kind`: a weekly
meetup *is* an event with photos and highlights. This avoids two near-identical
admin flows.

Every row carries `isSample` so development seed data is visibly tagged in the
UI and can be removed with one click in the admin.

## 4. Design direction

- Warm paper background, near-black ink, **BNI red used sparingly** as the accent.
- Editorial serif (Fraunces) for headlines, Inter for UI/body — strong hierarchy,
  restrained sizes.
- Hairline rules and whitespace instead of stacks of rounded cards; 6px radii.
- Real meetup photography drives the visual weight. When there is no photo, the
  UI falls back to typographic layouts and initials — never stock imagery.
- Light theme only (the brief asked to avoid dark UI unless it helps).
- Motion: subtle fade/rise on hover/load, disabled under `prefers-reduced-motion`.

## 5. Main user journeys

1. **Prospective visitor (mobile, from a WhatsApp link):** Home → sees "This week at
   BNI …" with photos → Next meeting band → *Plan your visit* → form or WhatsApp.
2. **Category shopper:** Home → Open categories → `/categories` → *Visit the chapter*.
3. **Referral seeker:** Members → search/filter → profile → website/WhatsApp.
4. **Existing member:** opens the shared meetup link → photos → shares again; adds
   the weekly meeting to their calendar.

## 6. Admin workflow (the weekly loop)

```
Admin → Dashboard → "+ Add weekly meetup"
      → date (pre-filled with the latest meeting day), title (pre-filled), summary
      → drop photos (resized in the browser, uploaded in parallel, progress shown)
      → optional: stats, highlights, visitors, new members, celebrations, spotlight, announcements
      → PUBLISH MEETUP  → homepage "Latest meetup" updates instantly → share link
```

## 7. Deployment

See `docs/DEPLOYMENT.md`. Summary: create a free Supabase project, run
`supabase/schema.sql`, create the `chapter-media` public bucket, set env vars in
Vercel, deploy, log in with `ADMIN_EMAIL`/`ADMIN_PASSWORD` (first login creates the
admin), fill in chapter settings, add members and categories.

## Future-ready seams

- `events.stats` / `events.highlights` are JSON → new metrics need no migration.
- `admin_users` → can grow a `role` column for member logins/dashboards.
- `visit_requests.status/notes` → visitor follow-up pipeline.
- `src/lib/notify.ts` → single place to add WhatsApp/email notifications.
- Referral / one-to-one / attendance tracking become new tables referencing `members`.
