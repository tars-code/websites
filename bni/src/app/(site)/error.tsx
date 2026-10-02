"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="page-x flex min-h-[60vh] flex-col items-start justify-center py-20" role="alert">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-3 text-[2.2rem]">This page didn&apos;t load properly</h1>
      <p className="mt-3 max-w-md text-muted">
        Please try again in a moment. If it keeps happening, you can still reach us from the visit page.
      </p>
      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/visit" variant="secondary">
          Visit page
        </ButtonLink>
      </div>
    </div>
  );
}
