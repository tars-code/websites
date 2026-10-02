import type { ChapterSettings } from "@/lib/types";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  CHAPTER DEFAULTS
 * ─────────────────────────────────────────────────────────────────────────────
 *  These are the starting values for the chapter. Everything here can be
 *  edited later in Admin → Chapter settings (values saved there override
 *  these). Values marked PLACEHOLDER must be replaced before launch — the
 *  admin dashboard lists any that are still unchanged.
 *
 *  Do not put statistics, testimonials or achievements here unless they are
 *  real.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const chapterDefaults: ChapterSettings = {
  name: "BNI Vaani Vilaasa",
  tagline: "A weekly business referral community of business owners and professionals in Bangalore.",
  description:
    "BNI Vaani Vilaasa is a chapter of business owners and professionals in Bangalore who meet every week to build trusted relationships and pass qualified referrals to one another. One member per business category, so every member can refer with confidence.",
  city: "Bangalore",
  timezone: "Asia/Kolkata",
  foundedOn: "",

  meeting: {
    day: "Friday",
    startTime: "07:30",
    endTime: "", // blank → shown as "7:30 AM onwards"
    format: "hybrid",
    // First Friday of each month face to face; all other Fridays on Zoom.
    pattern: "first_in_person",
    onlinePlatform: "Zoom",
    venueName: "Shravanti Sarovar Portico",
    address: "JP Nagar, Bangalore",
    mapUrl: "",
    // Not published on the site; the link is shared with visitors directly.
    onlineUrl: "",
    visitorNote:
      "On the first Friday of the month we meet face to face — please arrive a few minutes early for open networking and bring business cards. On other Fridays we meet on Zoom; we'll send you the link. Either way, be ready to introduce your business in about 30 seconds.",
  },

  contact: {
    name: "",
    role: "Visitor Host",
    phone: "",
    email: "",
    whatsapp: "",
  },

  social: [],
  bniLinks: [{ label: "About BNI", url: "https://www.bni.com" }],

  logoPhotoId: null,
  heroPhotoId: null,

  customStats: [],

  content: {
    whyVisit: [
      {
        title: "Meet local business owners",
        text: "Spend a morning with owners and professionals from different industries who meet every week, not once a quarter.",
      },
      {
        title: "Introduce your business",
        text: "Every visitor gets a short slot to say who they are and who they help. You leave with people who know what you do.",
      },
      {
        title: "See how referrals actually work",
        text: "Watch members pass referrals and thank each other for business closed. It's the clearest way to judge if this model suits you.",
      },
      {
        title: "Explore collaborations",
        text: "Many members work together on projects. A visit is a low-pressure way to find people whose clients overlap with yours.",
      },
      {
        title: "Understand the chapter culture",
        text: "Ask members anything over coffee. There is no obligation to join, and nobody will push you to.",
      },
    ],
    agenda: [
      { title: "Open networking", text: "Coffee and informal introductions before the meeting starts." },
      { title: "Welcome & chapter update", text: "The leadership team opens the meeting and shares news." },
      { title: "Member presentations", text: "Each member briefly shares what they do and the referrals they're looking for." },
      { title: "Visitor introductions", text: "Visitors introduce themselves and their business." },
      { title: "Feature presentation", text: "One member presents their business in depth." },
      { title: "Referrals & thank-yous", text: "Members pass referrals and recognise business that was closed." },
    ],
    audience: [
      "Business owners and independent professionals",
      "People who value long-term relationships over one-off sales",
      "Anyone whose category is open in our chapter",
      "Members of other chapters visiting or substituting",
    ],
    faqs: [
      {
        title: "Is there a cost to visit?",
        text: "Visiting is free unless the venue charges for breakfast — we'll tell you in advance if it does.",
      },
      {
        title: "Do I have to join after visiting?",
        text: "No. Visiting is the best way to see whether the chapter suits you. There is no obligation.",
      },
      {
        title: "What if my category is already taken?",
        text: "BNI allows one member per category in a chapter. Talk to us — sometimes a neighbouring specialisation is open, or another chapter may be a better fit.",
      },
      {
        title: "What should I bring?",
        text: "Business cards and a short introduction of what you do and who your ideal client is.",
      },
    ],
    about: [
      {
        title: "Why we exist",
        text: "We help each other grow by passing qualified referrals. Members commit to showing up every week, getting to know each other's businesses, and recommending each other with confidence.",
      },
      {
        title: "One member per category",
        text: "Each business category is held by one member, so there is no competition in the room — only collaboration.",
      },
      {
        title: "Relationships first",
        text: "Referrals come from trust, and trust comes from consistency: weekly meetings, one-to-one conversations and doing good work for each other's clients.",
      },
      {
        title: "Learning together",
        text: "Short education moments and member presentations help everyone get better at describing their business and spotting opportunities for others.",
      },
    ],
  },

  membersIndexable: true,

  attribution: {
    enabled: true,
    name: "Tars Technology",
    line: "Website & digital solutions",
    services: ["Websites", "Custom Software", "AI Solutions"],
    url: "https://www.tarstechnologies.com/",
    email: "",
    phone: "",
  },
};

/** Setup items the admin dashboard checks. */
export const placeholderChecks: { label: string; done: (c: ChapterSettings) => boolean }[] = [
  { label: "Meeting venue name", done: (c) => !!c.meeting.venueName.trim() },
  { label: "Meeting venue address", done: (c) => !!c.meeting.address.trim() },
];
