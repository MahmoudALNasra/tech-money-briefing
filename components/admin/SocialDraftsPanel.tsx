"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { getBusinessDataAuthHeaders } from "@/lib/business-data-client";
import type { SocialPostDraftRow } from "@/lib/social-drafts/types";

function formatWhen(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString();
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

function BrandedImagePreview({
  draftId,
  variant,
  alt
}: {
  draftId: string;
  variant: "square" | "landscape";
  alt: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(
          `/api/social-drafts/${draftId}/branded-image?variant=${variant}`,
          { headers: await getBusinessDataAuthHeaders() }
        );

        if (!response.ok) {
          throw new Error("Could not load branded image.");
        }

        const blob = await response.blob();
        if (cancelled) {
          return;
        }

        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
        }
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [draftId, variant]);

  if (error) {
    return <p className="mt-3 text-sm text-rose-700">{error}</p>;
  }

  if (!src) {
    return <p className="mt-3 text-sm text-stone-500">Loading image…</p>;
  }

  return (
    <img src={src} alt={alt} className="mt-3 w-full rounded-2xl border border-emerald-200" />
  );
}

async function downloadBrandedImage(
  draft: SocialPostDraftRow,
  variant: "square" | "landscape"
) {
  const publicUrl =
    variant === "square" ? draft.branded_image_square_url : draft.branded_image_landscape_url;

  if (publicUrl) {
    const anchor = document.createElement("a");
    anchor.href = publicUrl;
    anchor.download = `social-draft-${draft.id}-${variant}.png`;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
    return;
  }

  const response = await fetch(
    `/api/social-drafts/${draft.id}/branded-image?variant=${variant}`,
    { headers: await getBusinessDataAuthHeaders() }
  );

  if (!response.ok) {
    throw new Error("Could not download branded image.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `social-draft-${draft.id}-${variant}.png`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function SocialDraftsPanel() {
  const [drafts, setDrafts] = useState<SocialPostDraftRow[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadDrafts = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/social-drafts", {
        headers: await getBusinessDataAuthHeaders()
      });
      const json = (await response.json()) as {
        drafts?: SocialPostDraftRow[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(json.error ?? "Could not load drafts.");
      }

      setDrafts(json.drafts ?? []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  async function markPosted(id: string, platform: "linkedin" | "instagram") {
    setMessage("");

    try {
      const response = await fetch(`/api/admin/social-drafts/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await getBusinessDataAuthHeaders())
        },
        body: JSON.stringify({ platform })
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Could not mark draft as posted.");
      }

      await loadDrafts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleCopy(key: string, text: string) {
    await copyText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  }

  async function generateDraft() {
    setIsGenerating(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/social-drafts/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getBusinessDataAuthHeaders())
        },
        body: JSON.stringify({ forceSourceType: "enrichment_example" })
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(json.error ?? "Could not generate social draft.");
      }

      setMessage("New draft generated with owner voice, emojis, and branded images.");
      await loadDrafts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-400">
            Manual posting queue
          </p>
          <h1 className="mt-2 text-2xl font-black text-ink">Social drafts for /leads</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Review, copy, and post yourself on LinkedIn and Instagram. Nothing auto-publishes.
            Manual generate always uses an enrichment example with branded images (rotating
            styles), owner voice, and emoji polish on the copy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void generateDraft()}
            disabled={isGenerating}
            className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? "Generating…" : "Generate post"}
          </button>
          <Link
            href="/admin"
            className="rounded-full border border-stone-200 px-4 py-2 text-sm font-black text-stone-700 transition hover:bg-stone-50"
          >
            Account ops
          </Link>
          <button
            type="button"
            onClick={() => void loadDrafts()}
            className="rounded-full bg-ink px-4 py-2 text-sm font-black text-white transition hover:bg-stone-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {message ? (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            message.includes("generated")
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-stone-500">Loading drafts...</p>
      ) : drafts.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-stone-200 bg-white p-8 text-sm text-stone-600">
          No drafts yet. Click <span className="font-semibold">Generate post</span> or wait for the
          daily cron.
        </div>
      ) : (
        <div className="space-y-5">
          {drafts.map((draft) => (
            <article
              key={draft.id}
              className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-stone-400">
                    {draft.source_type.replace(/_/g, " ")} · {draft.run_label}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    Generated {formatWhen(draft.created_at)}
                    {draft.email_sent_at ? " · emailed" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em]">
                  <span
                    className={`rounded-full px-3 py-1 ${
                      draft.posted_linkedin_at
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    LinkedIn {draft.posted_linkedin_at ? "posted" : "pending"}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 ${
                      draft.posted_instagram_at
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    Instagram {draft.posted_instagram_at ? "posted" : "pending"}
                  </span>
                </div>
              </div>

              {draft.repetition_warning ? (
                <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Repetition check: {draft.repetition_warning}
                </p>
              ) : null}

              {draft.has_branded_images || draft.branded_image_variants ? (
                <>
                  {draft.branded_image_square_url || draft.branded_image_landscape_url ? (
                    <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <h2 className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">
                        Public image URLs
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-emerald-950">
                        Paste these when you add the image on Instagram or LinkedIn — they point at
                        your site.
                      </p>
                      <div className="mt-3 space-y-3">
                        {draft.branded_image_square_url ? (
                          <div className="rounded-xl border border-emerald-200 bg-white p-3">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">
                              Instagram · square
                            </p>
                            <p className="mt-1 break-all font-mono text-xs text-stone-800">
                              {draft.branded_image_square_url}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                void handleCopy(
                                  `${draft.id}-square-url`,
                                  draft.branded_image_square_url ?? ""
                                )
                              }
                              className="mt-2 rounded-full border border-emerald-200 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-800"
                            >
                              {copiedKey === `${draft.id}-square-url` ? "Copied" : "Copy URL"}
                            </button>
                          </div>
                        ) : null}
                        {draft.branded_image_landscape_url ? (
                          <div className="rounded-xl border border-emerald-200 bg-white p-3">
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-stone-500">
                              LinkedIn · landscape
                            </p>
                            <p className="mt-1 break-all font-mono text-xs text-stone-800">
                              {draft.branded_image_landscape_url}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                void handleCopy(
                                  `${draft.id}-landscape-url`,
                                  draft.branded_image_landscape_url ?? ""
                                )
                              }
                              className="mt-2 rounded-full border border-emerald-200 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-800"
                            >
                              {copiedKey === `${draft.id}-landscape-url` ? "Copied" : "Copy URL"}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </section>
                  ) : null}

                  <section className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">
                        Branded image · Square
                      </h2>
                      {draft.branded_image_variants ? (
                        <img
                          src={`data:image/png;base64,${draft.branded_image_variants.square.base64}`}
                          alt="Branded square result card for Instagram"
                          className="mt-3 w-full rounded-2xl border border-emerald-200"
                        />
                      ) : draft.branded_image_square_url ? (
                        <img
                          src={draft.branded_image_square_url}
                          alt="Branded square result card for Instagram"
                          className="mt-3 w-full rounded-2xl border border-emerald-200"
                        />
                      ) : (
                        <BrandedImagePreview
                          draftId={draft.id}
                          variant="square"
                          alt="Branded square result card for Instagram"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => void downloadBrandedImage(draft, "square")}
                        className="mt-2 inline-flex text-xs font-bold uppercase tracking-[0.14em] text-emerald-800"
                      >
                        Download square PNG
                      </button>
                    </div>
                    <div>
                      <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">
                        Branded image · Landscape
                      </h2>
                      {draft.branded_image_variants ? (
                        <img
                          src={`data:image/png;base64,${draft.branded_image_variants.landscape.base64}`}
                          alt="Branded landscape result card for LinkedIn"
                          className="mt-3 w-full rounded-2xl border border-emerald-200"
                        />
                      ) : draft.branded_image_landscape_url ? (
                        <img
                          src={draft.branded_image_landscape_url}
                          alt="Branded landscape result card for LinkedIn"
                          className="mt-3 w-full rounded-2xl border border-emerald-200"
                        />
                      ) : (
                        <BrandedImagePreview
                          draftId={draft.id}
                          variant="landscape"
                          alt="Branded landscape result card for LinkedIn"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => void downloadBrandedImage(draft, "landscape")}
                        className="mt-2 inline-flex text-xs font-bold uppercase tracking-[0.14em] text-emerald-800"
                      >
                        Download landscape PNG
                      </button>
                    </div>
                  </section>
                </>
              ) : draft.source_type !== "enrichment_example" ? (
                <p className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  No branded images for this draft — source type is{" "}
                  <span className="font-semibold">{draft.source_type.replace(/_/g, " ")}</span>.
                  Images appear on enrichment-example rotation days only.
                </p>
              ) : null}

              <section className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">
                    LinkedIn
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopy(`${draft.id}-linkedin`, draft.linkedin_draft)}
                      className="rounded-full border border-stone-200 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-stone-600"
                    >
                      {copiedKey === `${draft.id}-linkedin` ? "Copied" : "Copy"}
                    </button>
                    {!draft.posted_linkedin_at ? (
                      <button
                        type="button"
                        onClick={() => void markPosted(draft.id, "linkedin")}
                        className="rounded-full bg-ink px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white"
                      >
                        Mark posted
                      </button>
                    ) : null}
                  </div>
                </div>
                <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-800">
                  {draft.linkedin_draft}
                </pre>
              </section>

              <section className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-stone-500">
                    Instagram caption
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopy(`${draft.id}-instagram`, draft.instagram_caption)
                      }
                      className="rounded-full border border-stone-200 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-stone-600"
                    >
                      {copiedKey === `${draft.id}-instagram` ? "Copied" : "Copy"}
                    </button>
                    {!draft.posted_instagram_at ? (
                      <button
                        type="button"
                        onClick={() => void markPosted(draft.id, "instagram")}
                        className="rounded-full bg-ink px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white"
                      >
                        Mark posted
                      </button>
                    ) : null}
                  </div>
                </div>
                <pre className="mt-3 whitespace-pre-wrap rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-800">
                  {draft.instagram_caption}
                </pre>
              </section>

              <section className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">
                  Suggested visual (you attach it)
                </h2>
                <p className="mt-2 text-sm leading-6 text-emerald-950">
                  {draft.instagram_visual_direction}
                </p>
              </section>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
