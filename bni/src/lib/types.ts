/**
 * Domain model for the chapter website.
 * See docs/ARCHITECTURE.md for relationships and rationale.
 */

export type ID = string;

export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type MeetingFormat = "in_person" | "online" | "hybrid";

/**
 * How the weekly meeting alternates.
 * - "same_every_week": always `format` (in person / online / hybrid)
 * - "first_in_person": first meeting of each month in person, the rest online
 */
export type MeetingPattern = "same_every_week" | "first_in_person";

export interface LabeledText {
  title: string;
  text: string;
}

export interface SocialLink {
  label: string;
  url: string;
}

export interface CustomStat {
  label: string;
  value: string;
  /** Optional context shown under the number, e.g. "Jan–Sep 2026". */
  note?: string;
}

export interface ChapterSettings {
  name: string;
  /** Short line under the name, e.g. "A business referral community in Anna Nagar". */
  tagline: string;
  description: string;
  city: string;
  /** IANA timezone, used to compute the next meeting. */
  timezone: string;
  /** ISO date (YYYY-MM-DD) the chapter launched, if known. */
  foundedOn: string;

  meeting: {
    day: Weekday;
    /** 24h "HH:MM" */
    startTime: string;
    endTime: string;
    format: MeetingFormat;
    pattern: MeetingPattern;
    /** e.g. "Zoom" — used for online meetings. */
    onlinePlatform: string;
    venueName: string;
    address: string;
    mapUrl: string;
    onlineUrl: string;
    /** Free text shown to visitors, e.g. parking, dress code, arrive early. */
    visitorNote: string;
  };

  contact: {
    name: string;
    role: string;
    phone: string;
    email: string;
    /** Digits only with country code, e.g. 919876543210. */
    whatsapp: string;
  };

  social: SocialLink[];
  bniLinks: SocialLink[];

  logoPhotoId: ID | null;
  heroPhotoId: ID | null;

  /** Admin-entered numbers. Only shown when present. Never fabricated. */
  customStats: CustomStat[];

  content: {
    whyVisit: LabeledText[];
    agenda: LabeledText[];
    audience: string[];
    faqs: LabeledText[];
    about: LabeledText[];
  };

  /** Whether member profiles are indexable by search engines. */
  membersIndexable: boolean;

  attribution: {
    enabled: boolean;
    name: string;
    line: string;
    services: string[];
    url: string;
    email: string;
    phone: string;
  };
}

export type CategoryStatus = "open" | "filled";

export interface Category {
  id: ID;
  name: string;
  slug: string;
  /** Broad industry grouping used for filters, e.g. "Property & Construction". */
  group: string;
  description: string;
  status: CategoryStatus;
  /** Highlight as a category the chapter is actively looking for. */
  priority: boolean;
  sortOrder: number;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MemberStatus = "active" | "archived";

export interface Member {
  id: ID;
  slug: string;
  name: string;
  businessName: string;
  categoryId: ID | null;
  /** Leadership role, e.g. "President". Empty for most members. */
  role: string;
  /** One-line introduction shown on cards. */
  headline: string;
  about: string;
  services: string[];
  /** "A good referral for me is…" */
  referralTips: string;
  website: string;
  phone: string;
  email: string;
  whatsapp: string;
  showPhone: boolean;
  showEmail: boolean;
  social: SocialLink[];
  photoId: ID | null;
  joinedOn: string;
  featured: boolean;
  status: MemberStatus;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EventKind =
  | "weekly_meeting"
  | "visitor_day"
  | "training"
  | "social"
  | "event";

export type EventStatus = "draft" | "published" | "archived";

export interface MeetupStats {
  membersPresent?: number | null;
  visitors?: number | null;
  referrals?: number | null;
  newMembers?: number | null;
  oneToOnes?: number | null;
  /** Free-form business value, kept as text to avoid currency assumptions. */
  businessValue?: string | null;
}

export interface VisitorEntry {
  name: string;
  business: string;
}

export interface ChapterEvent {
  id: ID;
  slug: string;
  kind: EventKind;
  status: EventStatus;
  title: string;
  /** YYYY-MM-DD in chapter timezone */
  date: string;
  startTime: string;
  endTime: string;
  /** Empty → chapter meeting venue. */
  location: string;
  summary: string;
  body: string;
  visitorInfo: string;
  coverPhotoId: ID | null;
  stats: MeetupStats;
  highlights: string[];
  celebrations: string[];
  announcements: string[];
  achievements: string[];
  spotlight: string;
  visitors: VisitorEntry[];
  newMembers: string[];
  isSample: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PhotoPurpose = "gallery" | "member" | "chapter";

export interface Photo {
  id: ID;
  purpose: PhotoPurpose;
  eventId: ID | null;
  width: number;
  height: number;
  /** Widths of the generated webp variants, ascending. */
  widths: number[];
  blurDataUrl: string;
  alt: string;
  caption: string;
  sortOrder: number;
  isSample: boolean;
  createdAt: string;
}

export type VisitRequestStatus = "new" | "contacted" | "visited" | "closed";

export interface VisitRequest {
  id: ID;
  name: string;
  business: string;
  category: string;
  phone: string;
  email: string;
  preferredDate: string;
  message: string;
  status: VisitRequestStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  id: ID;
  email: string;
  name: string;
  passwordHash: string;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Table name → row type. Settings live in their own key/value table. */
export interface Tables {
  categories: Category;
  members: Member;
  events: ChapterEvent;
  photos: Photo;
  visit_requests: VisitRequest;
  admin_users: AdminUser;
}

export type TableName = keyof Tables;
