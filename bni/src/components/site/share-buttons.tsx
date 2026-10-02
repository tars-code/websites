"use client";

import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { buttonClass } from "@/components/ui/button";

const noopSubscribe = () => () => {};

/**
 * Share a meetup: native share sheet on phones, WhatsApp + copy link elsewhere.
 * Sharing is the growth loop — every share is a preview card with a real photo.
 */
export function ShareButtons({ url, title, text }: { url: string; title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = useSyncExternalStore(
    noopSubscribe,
    () => "share" in navigator,
    () => false,
  );

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url });
    } catch {
      /* user dismissed */
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={buttonClass("primary", "sm", "sm:hidden")}>
          <Share2 aria-hidden className="size-4" /> Share
        </button>
      )}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass("secondary", "sm")}
      >
        <MessageCircle aria-hidden className="size-4" /> WhatsApp
      </a>
      <button type="button" onClick={copy} className={buttonClass("secondary", "sm")} aria-live="polite">
        {copied ? <Check aria-hidden className="size-4 text-open" /> : <Link2 aria-hidden className="size-4" />}
        {copied ? "Link copied" : "Copy link"}
      </button>
    </div>
  );
}
