"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; tone: "success" | "error"; message: string };

let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(message: string, tone: Toast["tone"] = "success") {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, tone, message }];
  emit();
  setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4000);
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const EMPTY: Toast[] = [];

export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => EMPTY,
  );
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:right-6 sm:left-auto sm:items-end"
    >
      {list.map((t) => (
        <div
          key={t.id}
          role={t.tone === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm animate-rise items-start gap-3 rounded-md px-4 py-3 text-[0.92rem] shadow-[var(--shadow-lift)]",
            t.tone === "success" ? "bg-ink text-white" : "bg-accent text-white",
          )}
        >
          {t.tone === "success" ? (
            <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-[#7ee2b0]" />
          ) : (
            <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          )}
          <p className="flex-1">{t.message}</p>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-m-1 p-1 opacity-70 hover:opacity-100">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Shows a toast once for a ?saved=… style flag passed from the server. */
export function FlashToast({ message }: { message?: string }) {
  const shown = useRef(false);
  useEffect(() => {
    if (message && !shown.current) {
      toast(message);
      shown.current = true;
      const url = new URL(window.location.href);
      for (const k of ["saved", "deleted", "cleaned"]) url.searchParams.delete(k);
      window.history.replaceState(null, "", url);
    }
  }, [message]);
  return null;
}
