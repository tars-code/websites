-- ─────────────────────────────────────────────────────────────────────────────
-- Chapter website schema (Supabase / PostgreSQL)
-- Run once in Supabase → SQL Editor. Safe to re-run (idempotent).
--
-- Security model: the website server talks to the database with the
-- service-role key (server-side only). Row Level Security is enabled on every
-- table with NO policies, so the public anon key cannot read or write anything.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists categories (
  id          text primary key,
  name        text not null,
  slug        text not null unique,
  "group"     text not null default '',
  description text not null default '',
  status      text not null default 'open' check (status in ('open','filled')),
  priority    boolean not null default false,
  sort_order  integer not null default 0,
  is_sample   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists photos (
  id            text primary key,
  purpose       text not null check (purpose in ('gallery','member','chapter')),
  event_id      text,
  width         integer not null,
  height        integer not null,
  widths        jsonb not null default '[]',
  blur_data_url text not null default '',
  alt           text not null default '',
  caption       text not null default '',
  sort_order    integer not null default 0,
  is_sample     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists photos_event_id_idx on photos (event_id);
create index if not exists photos_purpose_idx on photos (purpose);

create table if not exists members (
  id             text primary key,
  slug           text not null unique,
  name           text not null,
  business_name  text not null default '',
  category_id    text references categories(id) on delete set null,
  role           text not null default '',
  headline       text not null default '',
  about          text not null default '',
  services       jsonb not null default '[]',
  referral_tips  text not null default '',
  website        text not null default '',
  phone          text not null default '',
  email          text not null default '',
  whatsapp       text not null default '',
  show_phone     boolean not null default false,
  show_email     boolean not null default false,
  social         jsonb not null default '[]',
  photo_id       text references photos(id) on delete set null,
  joined_on      text not null default '',
  featured       boolean not null default false,
  status         text not null default 'active' check (status in ('active','archived')),
  is_sample      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists members_category_idx on members (category_id);

create table if not exists events (
  id             text primary key,
  slug           text not null unique,
  kind           text not null default 'weekly_meeting',
  status         text not null default 'draft' check (status in ('draft','published','archived')),
  title          text not null,
  date           text not null,          -- YYYY-MM-DD in chapter timezone
  start_time     text not null default '',
  end_time       text not null default '',
  location       text not null default '',
  summary        text not null default '',
  body           text not null default '',
  visitor_info   text not null default '',
  cover_photo_id text references photos(id) on delete set null,
  stats          jsonb not null default '{}',
  highlights     jsonb not null default '[]',
  celebrations   jsonb not null default '[]',
  announcements  jsonb not null default '[]',
  achievements   jsonb not null default '[]',
  spotlight      text not null default '',
  visitors       jsonb not null default '[]',
  new_members    jsonb not null default '[]',
  is_sample      boolean not null default false,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists events_date_idx on events (date desc);

do $$ begin
  alter table photos add constraint photos_event_fk
    foreign key (event_id) references events(id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists visit_requests (
  id              text primary key,
  name            text not null,
  business        text not null default '',
  category        text not null default '',
  phone           text not null default '',
  email           text not null default '',
  preferred_date  text not null default '',
  message         text not null default '',
  status          text not null default 'new' check (status in ('new','contacted','visited','closed')),
  notes           text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists admin_users (
  id             text primary key,
  email          text not null unique,
  name           text not null default '',
  password_hash  text not null,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now()
);

alter table settings        enable row level security;
alter table categories      enable row level security;
alter table photos          enable row level security;
alter table members         enable row level security;
alter table events          enable row level security;
alter table visit_requests  enable row level security;
alter table admin_users     enable row level security;

-- Storage bucket for photos (public read; writes only via service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chapter-media', 'chapter-media', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;
