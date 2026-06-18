import { getAdminEmails } from "@/lib/admin-auth";
import { brandedImageVariantPublicUrl } from "@/lib/branded-result-image/types";
import { sendEmail } from "@/lib/email";
import type { SocialPostDraftRow } from "@/lib/social-drafts/types";
import { absoluteUrl } from "@/lib/site";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function socialDraftRecipients() {
  const configured = (process.env.SOCIAL_DRAFT_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  return getAdminEmails();
}

export async function sendSocialDraftEmail(draft: SocialPostDraftRow) {
  const recipients = socialDraftRecipients();

  if (recipients.length === 0) {
    return { sent: false, skipped: true, reason: "no_recipients" as const };
  }

  const adminUrl = absoluteUrl("/admin/social-drafts");
  const squareImageUrl =
    brandedImageVariantPublicUrl(draft.branded_image_variants, "square", absoluteUrl) ??
    (draft.branded_image_variants
      ? absoluteUrl(`/api/social-drafts/${draft.id}/branded-image?variant=square`)
      : null);
  const landscapeImageUrl =
    brandedImageVariantPublicUrl(draft.branded_image_variants, "landscape", absoluteUrl) ??
    (draft.branded_image_variants
      ? absoluteUrl(`/api/social-drafts/${draft.id}/branded-image?variant=landscape`)
      : null);
  const subject = `Today's /leads social drafts (${draft.source_type.replace(/_/g, " ")})`;
  const warning = draft.repetition_warning
    ? `\n\nRepetition check: ${draft.repetition_warning}`
    : "";

  const text = [
    "Today's social drafts for manual posting:",
    "",
    "LINKEDIN",
    draft.linkedin_draft,
    "",
    "INSTAGRAM CAPTION",
    draft.instagram_caption,
    "",
    draft.branded_image_variants
      ? "BRANDED IMAGES — paste these public URLs when posting (also attached to this email)"
      : "INSTAGRAM VISUAL DIRECTION (you pick/take the photo)",
    draft.branded_image_variants
      ? [
          squareImageUrl ? `Instagram (square): ${squareImageUrl}` : null,
          landscapeImageUrl ? `LinkedIn (landscape): ${landscapeImageUrl}` : null
        ]
          .filter(Boolean)
          .join("\n")
      : draft.instagram_visual_direction,
    "",
    `Review in admin: ${adminUrl}`,
    warning
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#111827;max-width:680px">
      <p style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280">
        Manual social drafts — not auto-published
      </p>
      <h1 style="font-size:22px;margin:12px 0 8px">Today's /leads drafts</h1>
      <p style="color:#4b5563">Source: <strong>${escapeHtml(draft.source_type.replace(/_/g, " "))}</strong></p>
      ${
        draft.repetition_warning
          ? `<p style="background:#fff7ed;border:1px solid #fdba74;padding:12px;border-radius:12px;color:#9a3412"><strong>Repetition check:</strong> ${escapeHtml(draft.repetition_warning)}</p>`
          : ""
      }
      ${
        draft.branded_image_variants
          ? `<div style="margin:20px 0">
              <h2 style="font-size:16px;margin:0 0 8px">Branded result card — public URLs</h2>
              <p style="color:#4b5563;font-size:14px">Use these links when you upload the image on Instagram or LinkedIn. PNGs are also attached.</p>
              <ul style="padding-left:18px;color:#111827">
                ${squareImageUrl ? `<li><a href="${squareImageUrl}">Square (Instagram)</a></li>` : ""}
                ${landscapeImageUrl ? `<li><a href="${landscapeImageUrl}">Landscape (LinkedIn)</a></li>` : ""}
              </ul>
            </div>`
          : ""
      }
      <h2 style="font-size:16px;margin:24px 0 8px">LinkedIn</h2>
      <pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e5e7eb;padding:14px;border-radius:14px">${escapeHtml(draft.linkedin_draft)}</pre>
      <h2 style="font-size:16px;margin:24px 0 8px">Instagram caption</h2>
      <pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e5e7eb;padding:14px;border-radius:14px">${escapeHtml(draft.instagram_caption)}</pre>
      ${
        draft.branded_image_variants
          ? ""
          : `<h2 style="font-size:16px;margin:24px 0 8px">Suggested visual (you attach the real photo/screenshot)</h2>
             <p style="background:#f0fdf4;border:1px solid #bbf7d0;padding:14px;border-radius:14px;color:#14532d">${escapeHtml(draft.instagram_visual_direction)}</p>`
      }
      <p style="margin-top:24px"><a href="${adminUrl}">Open admin drafts page</a> to copy, edit, and mark posted.</p>
    </div>
  `;

  const attachments = draft.branded_image_variants
    ? [
        {
          filename: `trb-leads-result-square-${draft.id}.png`,
          content: draft.branded_image_variants.square.base64
        },
        {
          filename: `trb-leads-result-landscape-${draft.id}.png`,
          content: draft.branded_image_variants.landscape.base64
        }
      ]
    : undefined;

  let sentAny = false;

  for (const to of recipients) {
    const result = await sendEmail({
      to,
      subject,
      html,
      text,
      attachments
    });

    if (result.sent) {
      sentAny = true;
    }
  }

  return { sent: sentAny, skipped: !sentAny, reason: sentAny ? null : ("email_skipped" as const) };
}
