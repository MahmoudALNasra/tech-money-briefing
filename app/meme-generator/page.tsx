import type { Metadata } from "next";

import { MemeGenerator } from "@/components/meme/MemeGenerator";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getPublicNavCategories } from "@/lib/adsense-readiness";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Free Meme Generator - Upload a Photo and Add Text",
  description: `Use this free meme generator to upload a photo, add top and bottom text, customize the caption, and download a PNG meme - from ${siteConfig.name}.`,
  keywords: [
    "free meme generator",
    "meme generator",
    "upload photo meme generator",
    "add text to photo",
    "make a meme",
    "meme maker",
    "download meme PNG",
    "custom meme generator"
  ],
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    title: "Free Meme Generator - Upload a Photo and Add Text",
    description:
      "Upload your own photo or pick an original template, add meme text, customize the caption, and download a PNG."
  }
};

export default function MemeGeneratorPage() {
  return (
    <>
      <SiteHeader categories={[...getPublicNavCategories()]} />
      <main className="bg-stone-50 pt-[73px]">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-500">
              Free tool
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-ink sm:text-5xl">
              Free meme generator
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
              Upload a photo or pick a classic-style original template, add top
              and bottom text, customize the caption, and download a PNG meme.
              Built for Reddit, TikTok, and group chats - no account needed.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
              Make a meme from your own image, edit the font size and text
              color, then save it instantly. This meme maker uses original
              built-in templates and also works with your uploaded photos.
            </p>
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
          <MemeGenerator />
        </section>
      </main>
    </>
  );
}
