import type { Metadata } from "next";

import { AbeerChat } from "./AbeerChat";

export const metadata: Metadata = {
  title: "Temporary Project Chat",
  description: "A temporary private project chat.",
  robots: {
    index: false,
    follow: false
  }
};

export default function AbeerPage() {
  return <AbeerChat />;
}
