import Link from "next/link";
import type { Img } from "@/lib/media";
import { cn } from "@/lib/utils";
import { SmartImage } from "@/components/ui/smart-image";

/** Splits "BNI Something" into the BNI mark + chapter name. */
export function splitChapterName(name: string) {
  const m = /^BNI\s+(.+)$/i.exec(name.trim());
  return m ? { prefix: "BNI", rest: m[1] } : { prefix: "", rest: name };
}

export function Brand({
  name,
  logo,
  className,
  size = "md",
}: {
  name: string;
  logo: Img | null;
  className?: string;
  size?: "md" | "lg";
}) {
  const { prefix, rest } = splitChapterName(name);
  return (
    <Link
      href="/"
      className={cn("group flex min-w-0 items-center gap-2.5", className)}
      aria-label={`${name} — home`}
    >
      {logo ? (
        <SmartImage
          img={logo}
          alt=""
          sizes="40px"
          className="size-9 shrink-0 rounded-sm object-contain"
          priority
        />
      ) : (
        prefix && (
          <span
            aria-hidden
            className="inline-flex h-7 shrink-0 items-center rounded-sm bg-accent px-1.5 text-[0.78rem] font-bold tracking-wider text-white"
          >
            {prefix}
          </span>
        )
      )}
      <span
        className={cn(
          "display truncate text-ink",
          size === "lg" ? "text-2xl" : "text-[1.22rem] sm:text-[1.3rem]",
        )}
      >
        {logo && prefix ? name : rest}
      </span>
    </Link>
  );
}
