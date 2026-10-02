import { ImageResponse } from "next/og";
import { meetingPlace, meetingSchedule } from "@/lib/chapter-text";
import { getChapter } from "@/lib/data";

export const revalidate = 3600;

/**
 * Fallback social preview (1200×630) used when the chapter has no hero photo.
 * Pages with real photos (meetups, members) use those instead.
 */
export async function GET() {
  const c = await getChapter();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#faf8f4",
          padding: "72px 80px",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 8, background: "#c8102e" }} />
          <div style={{ fontSize: 26, letterSpacing: 4, color: "#63666f", fontFamily: "sans-serif" }}>
            {c.city.toUpperCase()}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, color: "#16171b", lineHeight: 1.05 }}>{c.name}</div>
          <div style={{ fontSize: 34, color: "#34363d", marginTop: 24, fontFamily: "sans-serif", maxWidth: 980 }}>
            {c.tagline}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontFamily: "sans-serif", fontSize: 28, color: "#34363d" }}>
          <div>{meetingSchedule(c)}</div>
          <div style={{ color: "#63666f", marginTop: 6 }}>{meetingPlace(c)}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
