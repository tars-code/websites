// Run with: npm test   (Node ≥ 22.18 runs TypeScript directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  formatDateLong,
  formatTime,
  formatTimeRange,
  lastWeeklyDate,
  nextWeeklyDate,
  relativeDay,
} from "../src/lib/dates.ts";
import { displayUrl, initials, safeUrl, slugify, uniqueSlug, whatsappLink } from "../src/lib/utils.ts";

const TZ = "Asia/Kolkata";
// 2026-10-01 is a Thursday. 01:30 UTC = 07:00 IST.
const thuMorning = new Date("2026-10-01T01:30:00Z");

test("next weekly meeting: later this week", () => {
  assert.equal(nextWeeklyDate(TZ, "Friday", "08:30", thuMorning), "2026-10-02");
});

test("next weekly meeting: today while the meeting is still on", () => {
  const friDuring = new Date("2026-10-02T02:00:00Z"); // 07:30 IST Friday
  assert.equal(nextWeeklyDate(TZ, "Friday", "08:30", friDuring), "2026-10-02");
});

test("next weekly meeting: rolls to next week once it has ended", () => {
  const friAfter = new Date("2026-10-02T04:00:00Z"); // 09:30 IST Friday
  assert.equal(nextWeeklyDate(TZ, "Friday", "08:30", friAfter), "2026-10-09");
});

test("next weekly meeting respects the chapter timezone, not UTC", () => {
  // 20:00 UTC Thursday is already 01:30 Friday in India.
  const lateThuUtc = new Date("2026-10-01T20:00:00Z");
  assert.equal(nextWeeklyDate(TZ, "Friday", "08:30", lateThuUtc), "2026-10-02");
  assert.equal(nextWeeklyDate("America/New_York", "Friday", "08:30", lateThuUtc), "2026-10-02");
});

test("last weekly meeting date (default for a new meetup)", () => {
  assert.equal(lastWeeklyDate(TZ, "Friday", thuMorning), "2026-09-25");
  assert.equal(lastWeeklyDate(TZ, "Thursday", thuMorning), "2026-10-01");
});

test("date arithmetic crosses month and year boundaries", () => {
  assert.equal(addDays("2026-12-30", 3), "2027-01-02");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("formatting is deterministic (no locale differences)", () => {
  assert.equal(formatDateLong("2026-09-26"), "Saturday, 26 September 2026");
  assert.equal(formatDateLong("2026-10-02", false), "Friday, 2 October");
  assert.equal(formatTime("07:00"), "7:00 AM");
  assert.equal(formatTime("12:15"), "12:15 PM");
  assert.equal(formatTime("00:05"), "12:05 AM");
  assert.equal(formatTimeRange("19:00", "21:30"), "7:00 PM – 9:30 PM");
});

test("relative day labels", () => {
  assert.equal(relativeDay("2026-10-01", "2026-10-01"), "Today");
  assert.equal(relativeDay("2026-10-02", "2026-10-01"), "Tomorrow");
  assert.equal(relativeDay("2026-10-04", "2026-10-01"), "In 3 days");
  assert.equal(relativeDay("2026-12-01", "2026-10-01"), "");
});

test("slugs, urls and links", () => {
  assert.equal(slugify("Interior Design & Décor"), "interior-design-and-decor");
  assert.equal(uniqueSlug("weekly", ["weekly", "weekly-2"]), "weekly-3");
  assert.equal(safeUrl("example.com"), "https://example.com/");
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(displayUrl("https://www.example.com/"), "example.com");
  assert.equal(whatsappLink("+91 98765-43210"), "https://wa.me/919876543210");
  assert.equal(whatsappLink(""), "");
  assert.equal(initials("Meera  Krishnan"), "MK");
});

import { addMinutes, weekOfMonth } from "../src/lib/dates.ts";

test("first-week detection for hybrid chapters", () => {
  assert.equal(weekOfMonth("2026-10-02"), 1); // first Friday of October
  assert.equal(weekOfMonth("2026-10-09"), 2);
  assert.equal(weekOfMonth("2026-10-30"), 5);
  assert.equal(weekOfMonth("2026-11-06"), 1);
});

test("open-ended meetings", () => {
  assert.equal(formatTimeRange("07:30", ""), "7:30 AM onwards");
  assert.equal(addMinutes("07:30", 120), "09:30");
  assert.equal(addMinutes("23:00", 120), "23:59");
});
