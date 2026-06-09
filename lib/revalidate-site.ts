import { siteConfig } from "@/lib/site";

export async function revalidateSiteCache(options?: {
  paths?: string[];
  tags?: string[];
}) {
  const secret = process.env.CRON_SECRET;
  const siteUrl = siteConfig.url;

  if (!secret) {
    console.warn("[revalidate] Skipped: CRON_SECRET is not configured");
    return;
  }

  const response = await fetch(`${siteUrl}/api/revalidate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      paths: options?.paths ?? ["/", "/others"],
      tags: options?.tags ?? ["articles"]
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Revalidate failed (${response.status}): ${message}`);
  }

  console.log("[revalidate] Site cache cleared");
}
