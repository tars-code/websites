import "server-only";

/**
 * Server-side environment. Never import this from a client component —
 * `server-only` makes that a build error.
 */
export const env = {
  /** Public site URL for share links, sitemap and OpenGraph. On Vercel it
   *  falls back to the project's production domain automatically. */
  siteUrl: (
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
    "http://localhost:3000"
  ).replace(/\/$/, ""),

  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseBucket: process.env.SUPABASE_BUCKET || "chapter-media",

  dataDir: process.env.DATA_DIR || ".data",

  authSecret: process.env.AUTH_SECRET || "",
  adminEmail: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || "",

  notifyWebhookUrl: process.env.VISIT_REQUEST_WEBHOOK_URL || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  notifyEmailTo: process.env.NOTIFY_EMAIL_TO || "",
  notifyEmailFrom: process.env.NOTIFY_EMAIL_FROM || "",

  isProduction: process.env.NODE_ENV === "production",
  isVercel: !!process.env.VERCEL,
};

export const useSupabase = Boolean(env.supabaseUrl && env.supabaseServiceKey);

/**
 * True when running on a host with an ephemeral filesystem but no database
 * configured — writes would be lost, so the admin shows a setup warning.
 */
export const storageMisconfigured = !useSupabase && env.isVercel;
