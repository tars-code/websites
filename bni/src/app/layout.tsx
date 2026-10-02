import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { getChapter, getImg } from "@/lib/data";
import { env } from "@/lib/env";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

export async function generateMetadata(): Promise<Metadata> {
  const chapter = await getChapter();
  const hero = await getImg(chapter.heroPhotoId, chapter.name);
  const description = chapter.tagline || chapter.description;
  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: `${chapter.name} · ${chapter.city}`, template: `%s · ${chapter.name}` },
    description,
    applicationName: chapter.name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: chapter.name,
      locale: "en_IN",
      title: chapter.name,
      description,
      images: hero
        ? [{ url: hero.large, width: hero.width, height: hero.height, alt: hero.alt }]
        : [{ url: "/og", width: 1200, height: 630, alt: chapter.name }],
    },
    twitter: { card: "summary_large_image", title: chapter.name, description },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#faf8f4",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
