#!/usr/bin/env node
/**
 * DEVELOPMENT SEED — writes SAMPLE data to the local JSON store (.data/).
 *
 *   npm run seed           # adds sample data (refuses if data already exists)
 *   npm run seed -- --reset  # wipes .data/ first
 *
 * Every record is flagged isSample: true and shows a "Sample" tag in the UI.
 * This script never touches Supabase — production data starts empty.
 */
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

if (process.env.SUPABASE_URL) {
  console.error("SUPABASE_URL is set — refusing to seed. The seed is for local development only.");
  process.exit(1);
}

const dataDir = path.resolve(process.env.DATA_DIR || ".data");
const dbFile = path.join(dataDir, "db.json");
if (process.argv.includes("--reset")) rmSync(dataDir, { recursive: true, force: true });
if (existsSync(dbFile)) {
  console.error(`${dbFile} already exists. Use "npm run seed -- --reset" to start over.`);
  process.exit(1);
}

const now = new Date().toISOString();
const id = () => randomUUID();
const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ── dates relative to today (Asia/Kolkata, Friday meetings) ── */
const tz = "Asia/Kolkata";
const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
const addDays = (d, n) => {
  const x = new Date(`${d}T12:00:00Z`);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const dow = new Date(`${todayStr}T12:00:00Z`).getUTCDay(); // 0=Sun
const lastFriday = addDays(todayStr, -((dow - 5 + 7) % 7 || 7));
const nextFriday = addDays(todayStr, (5 - dow + 7) % 7 || 7);

/* ── placeholder photo generator ── */
const palettes = [
  ["#3b2f2a", "#a0764f", "#e7c9a0"],
  ["#2d3436", "#7f8c8d", "#dfe6e9"],
  ["#40302b", "#b5654b", "#f2d4b6"],
  ["#2f3a32", "#6f8a6b", "#d7e2c8"],
  ["#2b2d42", "#8d99ae", "#edf2f4"],
  ["#4a3728", "#c08b5c", "#f6e3c8"],
];

function placeholderSvg(seed, w, h) {
  const [dark, mid, light] = palettes[seed % palettes.length];
  let rnd = seed * 9301 + 49297;
  const r = () => ((rnd = (rnd * 9301 + 49297) % 233280) / 233280);
  const blobs = Array.from({ length: 9 }, () => {
    const cx = Math.round(r() * w), cy = Math.round(h * 0.35 + r() * h * 0.5);
    const rad = Math.round(h * (0.06 + r() * 0.1));
    return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${r() > 0.5 ? mid : dark}" opacity="${(0.35 + r() * 0.4).toFixed(2)}"/>`;
  }).join("");
  const lights = Array.from({ length: 14 }, () => {
    const cx = Math.round(r() * w), cy = Math.round(r() * h * 0.35);
    return `<circle cx="${cx}" cy="${cy}" r="${Math.round(h * 0.03 + r() * h * 0.05)}" fill="${light}" opacity="${(0.15 + r() * 0.35).toFixed(2)}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${light}"/><stop offset="0.55" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/>
      </linearGradient>
      <filter id="b"><feGaussianBlur stdDeviation="${Math.round(h * 0.03)}"/></filter>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <g filter="url(#b)">${lights}${blobs}</g>
    <rect x="${Math.round(w * 0.03)}" y="${Math.round(h - h * 0.12)}" rx="6" width="${Math.round(w * 0.2)}" height="${Math.round(h * 0.075)}" fill="#000" opacity="0.45"/>
    <text x="${Math.round(w * 0.045)}" y="${Math.round(h - h * 0.065)}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.035)}" fill="#fff" font-weight="600">SAMPLE PHOTO</text>
  </svg>`;
}

const photos = [];
async function makePhoto(seed, eventId, alt, sortOrder, w = 1800, h = 1200) {
  const pid = id();
  const src = sharp(Buffer.from(placeholderSvg(seed, w, h)));
  const widths = [480, 960, 1600];
  for (const width of widths) {
    const out = path.join(dataDir, "uploads", "photos", pid, `${width}.webp`);
    mkdirSync(path.dirname(out), { recursive: true });
    await src.clone().resize({ width }).webp({ quality: 74 }).toFile(out);
  }
  const blur = await src.clone().resize(16).webp({ quality: 40 }).toBuffer();
  const photo = {
    id: pid, purpose: "gallery", eventId, width: w, height: h, widths,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
    alt, caption: "", sortOrder, isSample: true, createdAt: now,
  };
  photos.push(photo);
  return photo;
}

/* ── categories ── */
const catDefs = [
  ["Website & Software Development", "Technology"],
  ["Chartered Accountant", "Finance"],
  ["Financial Planning", "Finance"],
  ["Residential Real Estate", "Property & Construction"],
  ["Architecture", "Property & Construction"],
  ["Interior Design", "Property & Construction"],
  ["Corporate Lawyer", "Legal"],
  ["Digital Marketing", "Marketing"],
  ["Commercial Printing", "Marketing"],
  ["Physiotherapy", "Health & Wellness"],
  ["Dentistry", "Health & Wellness"],
  ["Event Management", "Events & Hospitality"],
  ["General Insurance", "Finance"],
  ["Electrical Contractor", "Property & Construction"],
  ["Travel Agency", "Events & Hospitality"],
  ["HR & Recruitment", "Business Services"],
  ["Photography", "Marketing"],
  ["Solar Energy", "Property & Construction"],
  ["Corporate Gifting", "Business Services"],
  ["Nutritionist", "Health & Wellness"],
];
const categories = catDefs.map(([name, group], i) => ({
  id: id(), name, slug: slug(name), group, description: "",
  status: i < 12 ? "filled" : "open", priority: [12, 14, 17].includes(i),
  sortOrder: i, isSample: true, createdAt: now, updatedAt: now,
}));

/* ── members (fictional, for layout only) ── */
const memberDefs = [
  ["Arjun Raman", "Sample Software Studio", "Custom websites and business software for growing companies.", "President"],
  ["Meera Krishnan", "Sample & Co. Chartered Accountants", "Tax, audit and compliance for SMEs and startups.", "Vice President"],
  ["Rahul Menon", "Sample Wealth Advisors", "Goal-based financial planning for families and business owners.", "Secretary / Treasurer"],
  ["Divya Subramanian", "Sample Homes Realty", "Helping families buy and sell homes across the city.", ""],
  ["Karthik Iyer", "Sample Architects", "Residential and commercial architecture, from concept to completion.", ""],
  ["Ananya Rao", "Sample Interiors", "Turnkey interiors for homes and offices.", ""],
  ["Vikram Natarajan", "Sample Legal Associates", "Company law, contracts and startup legal support.", ""],
  ["Priya Venkatesh", "Sample Digital", "Performance marketing and social media for local brands.", ""],
  ["Suresh Kumar", "Sample Print House", "Offset and digital printing, packaging and signage.", ""],
  ["Lakshmi Narayanan", "Sample Physio Clinic", "Sports injury rehab and posture correction.", ""],
  ["Aditya Sharma", "Sample Dental Care", "Family dentistry and smile design.", ""],
  ["Nisha Pillai", "Sample Events", "Corporate events, launches and family celebrations.", ""],
];
const members = memberDefs.map(([name, businessName, headline, role], i) => ({
  id: id(), slug: slug(name), name, businessName, categoryId: categories[i].id, role, headline,
  about: `${name.split(" ")[0]} runs ${businessName}. This is sample text so you can see how a full profile looks — replace it with the member's own introduction.`,
  services: ["Sample service one", "Sample service two", "Sample service three"],
  referralTips: "A good referral for me is a business owner who is planning a new project in the next three months.",
  website: "https://example.com", phone: "+91 90000 00000", email: "member@example.com", whatsapp: "",
  showPhone: false, showEmail: false, social: [], photoId: null, joinedOn: "",
  featured: i < 8, status: "active", isSample: true, createdAt: now, updatedAt: now,
}));

/* ── events ── */
function event(over) {
  return {
    id: id(), kind: "weekly_meeting", status: "published", startTime: "07:00", endTime: "08:30",
    location: "", summary: "", body: "", visitorInfo: "", coverPhotoId: null, stats: {},
    highlights: [], celebrations: [], announcements: [], achievements: [], spotlight: "",
    visitors: [], newMembers: [], isSample: true, publishedAt: now, createdAt: now, updatedAt: now,
    ...over,
  };
}
const meetups = [
  event({
    date: lastFriday, title: "Weekly Meeting", slug: `weekly-meeting-${lastFriday}`,
    summary: "Sample meetup: a full room, two first-time visitors and a feature presentation on planning a home renovation.",
    stats: { membersPresent: 11, visitors: 2, referrals: 7 },
    highlights: [
      "Feature presentation by the architecture member on planning a home renovation",
      "Seven referrals passed across finance, property and marketing",
      "Visitors from solar energy and travel introduced their businesses",
    ],
    celebrations: ["Sample: a member's 5th BNI anniversary"],
    spotlight: "Sample spotlight text about a member's recent project.",
    visitors: [{ name: "Sample Visitor", business: "Solar Energy" }],
  }),
  event({
    date: addDays(lastFriday, -7), title: "Weekly Meeting", slug: `weekly-meeting-${addDays(lastFriday, -7)}`,
    summary: "Sample meetup: education moment on giving better referrals.",
    stats: { membersPresent: 10, visitors: 1 },
    highlights: ["Education moment: how to describe a good referral in one sentence"],
  }),
  event({
    date: addDays(lastFriday, -14), title: "Weekly Meeting", slug: `weekly-meeting-${addDays(lastFriday, -14)}`,
    summary: "Sample meetup.",
    stats: { membersPresent: 12 },
  }),
];
const upcoming = [
  event({
    kind: "visitor_day", date: addDays(nextFriday, 14), title: "Visitor Day",
    slug: `visitor-day-${addDays(nextFriday, 14)}`, publishedAt: now,
    summary: "Sample event: a meeting designed for first-time visitors, with extra time for introductions.",
    visitorInfo: "Bring a friend in business. Breakfast is on the chapter.",
  }),
  event({
    kind: "social", date: addDays(nextFriday, 22), title: "Members' Evening Social",
    slug: `members-social-${addDays(nextFriday, 22)}`, startTime: "19:00", endTime: "21:30",
    location: "Sample restaurant", summary: "Sample event: an informal evening for members and their families.",
  }),
];

let seed = 1;
for (const [mi, m] of meetups.entries()) {
  const n = [8, 5, 4][mi];
  for (let i = 0; i < n; i++) {
    const p = await makePhoto(seed++, m.id, `Sample photo ${i + 1} from the weekly meeting`, i);
    if (i === 0) m.coverPhotoId = p.id;
  }
}

const visitRequests = [
  { id: id(), name: "Sample Visitor", business: "Sample Solar Pvt Ltd", category: "Solar Energy", phone: "+91 90000 11111",
    email: "visitor@example.com", preferredDate: nextFriday, message: "Sample request — would like to visit next week.",
    status: "new", notes: "", createdAt: now, updatedAt: now },
];

const db = {
  tables: {
    categories, members, events: [...meetups, ...upcoming], photos,
    visit_requests: visitRequests, admin_users: [],
  },
  settings: {},
};
mkdirSync(dataDir, { recursive: true });
writeFileSync(dbFile, JSON.stringify(db, null, 2));
console.log(`Seeded SAMPLE data → ${dbFile}`);
console.log(`  ${categories.length} categories, ${members.length} members, ${db.tables.events.length} events, ${photos.length} photos`);
console.log("  Everything is tagged 'Sample'. Remove it from Admin → Dashboard when you're ready.");
