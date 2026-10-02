import type { ZodError } from "zod";

/** Shared shape for useActionState-driven forms (public and admin). */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
  /** Echo of submitted values so fields keep their content after an error. */
  values?: Record<string, string>;
  /** Optional payload on success, e.g. a created record id. */
  data?: Record<string, string>;
};

export const idleState: FormState = { status: "idle" };

export function fieldErrors(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}

export function formValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !k.startsWith("$")) out[k] = v;
  return out;
}
