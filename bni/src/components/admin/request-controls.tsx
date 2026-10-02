"use client";

import { useState, useTransition } from "react";
import { updateVisitRequest } from "@/app/admin/_actions/misc";
import type { VisitRequestStatus } from "@/lib/types";
import { toast } from "./toast";

const labels: Record<VisitRequestStatus, string> = {
  new: "New",
  contacted: "Contacted",
  visited: "Visited",
  closed: "Closed",
};

export function RequestStatusSelect({ id, status }: { id: string; status: VisitRequestStatus }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Status"
      defaultValue={status}
      disabled={pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("id", id);
        fd.set("status", e.target.value);
        start(async () => {
          await updateVisitRequest(fd);
          toast(`Marked as ${labels[e.target.value as VisitRequestStatus].toLowerCase()}.`);
        });
      }}
      className="h-9 rounded-md border border-line-strong bg-surface px-2 text-[0.86rem] font-medium"
    >
      {Object.entries(labels).map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

export function RequestNotes({ id, status, initial }: { id: string; status: VisitRequestStatus; initial: string }) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <textarea
      aria-label="Follow-up notes"
      placeholder="Follow-up notes (only admins see these)"
      value={value}
      rows={2}
      disabled={pending}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => {
        if (value === initial) return;
        const fd = new FormData();
        fd.set("id", id);
        fd.set("status", status);
        fd.set("notes", value);
        start(async () => {
          await updateVisitRequest(fd);
          toast("Notes saved.");
        });
      }}
      className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[0.86rem] focus:border-ink focus:bg-surface focus:outline-none"
    />
  );
}
