import "server-only";
import { env } from "@/lib/env";
import type { VisitRequest } from "@/lib/types";

/**
 * Optional notifications for new visit requests. Both channels are off unless
 * configured; failures are logged and never block the visitor.
 *
 *  - VISIT_REQUEST_WEBHOOK_URL: receives a JSON POST (works with Slack/Discord
 *    incoming webhooks, Zapier, Make, Google Apps Script, n8n…)
 *  - RESEND_API_KEY + NOTIFY_EMAIL_TO + NOTIFY_EMAIL_FROM: sends an email via
 *    Resend's free tier.
 *
 * Future: WhatsApp Business API would slot in here.
 */
export async function notifyVisitRequest(req: VisitRequest, chapterName: string) {
  const lines = [
    `New visit request — ${chapterName}`,
    `Name: ${req.name}`,
    req.business && `Business: ${req.business}`,
    req.category && `Category: ${req.category}`,
    req.phone && `Phone: ${req.phone}`,
    req.email && `Email: ${req.email}`,
    req.preferredDate && `Preferred date: ${req.preferredDate}`,
    req.message && `Message: ${req.message}`,
    `Manage: ${env.siteUrl}/admin/requests`,
  ].filter(Boolean) as string[];
  const text = lines.join("\n");

  const jobs: Promise<unknown>[] = [];
  if (env.notifyWebhookUrl) {
    jobs.push(
      fetch(env.notifyWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, content: text, visitRequest: req }),
      }),
    );
  }
  if (env.resendApiKey && env.notifyEmailTo && env.notifyEmailFrom) {
    jobs.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.resendApiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: env.notifyEmailFrom,
          to: env.notifyEmailTo.split(",").map((s) => s.trim()),
          subject: `Visit request: ${req.name}${req.business ? ` (${req.business})` : ""}`,
          text,
          ...(req.email ? { reply_to: req.email } : {}),
        }),
      }),
    );
  }
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("visit notification failed", r.reason);
}
