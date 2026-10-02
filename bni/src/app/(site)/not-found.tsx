import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="page-x flex min-h-[60vh] flex-col items-start justify-center py-20">
      <p className="eyebrow">404</p>
      <h1 className="display mt-3 text-[2.4rem]">We couldn&apos;t find that page</h1>
      <p className="mt-3 max-w-md text-muted">
        It may have moved, or the meetup or member may no longer be listed.
      </p>
      <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
        <ButtonLink href="/">Go to homepage</ButtonLink>
        <ButtonLink href="/members" variant="secondary">
          Browse members
        </ButtonLink>
      </div>
    </div>
  );
}
