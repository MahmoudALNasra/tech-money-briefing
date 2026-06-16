import { sendEmail } from "@/lib/email";
import { absoluteUrl, siteConfig } from "@/lib/site";

function formatAmount(amountTotal?: number | null, currency?: string | null) {
  if (typeof amountTotal !== "number" || !Number.isFinite(amountTotal) || amountTotal < 0) {
    return null;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "usd").toUpperCase()
  }).format(amountTotal / 100);
}

export async function sendBusinessDataPaymentEmail(input: {
  to?: string | null;
  bundleName?: string | null;
  credits: number;
  amountTotal?: number | null;
  currency?: string | null;
}) {
  const to = input.to?.trim();

  if (!to) {
    return { sent: false, skipped: true };
  }

  const siteName = siteConfig.name;
  const reportUrl = absoluteUrl("/leads");
  const amount = formatAmount(input.amountTotal, input.currency);
  const bundleName = input.bundleName?.trim() || "Business data credits";
  const subject = `${siteName} - your business data credits are ready`;
  const amountLine = amount ? `<li><strong>Payment:</strong> ${amount}</li>` : "";
  const amountText = amount ? `Payment: ${amount}\n` : "";

  return sendEmail({
    to,
    subject,
    html: `
      <div style="margin:0; padding:0; background:#f5f5f4; font-family: Arial, Helvetica, sans-serif; color:#1c1917;">
        <div style="max-width:640px; margin:0 auto; padding:32px 18px;">
          <div style="background:#ffffff; border:1px solid #e7e5e4; border-radius:28px; padding:32px;">
            <p style="margin:0 0 10px; color:#047857; font-size:12px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase;">
              Payment confirmed
            </p>
            <h1 style="margin:0; font-size:28px; line-height:1.2; color:#1c1917;">
              Your credits are ready
            </h1>
            <p style="margin:18px 0 0; color:#57534e; font-size:16px; line-height:1.6;">
              Thanks for your purchase. We added the credits to your ${siteName} account so you can continue building business data reports.
            </p>
            <ul style="margin:22px 0; padding-left:20px; color:#44403c; font-size:15px; line-height:1.8;">
              <li><strong>Package:</strong> ${bundleName}</li>
              <li><strong>Credits added:</strong> ${input.credits}</li>
              ${amountLine}
            </ul>
            <p style="margin:28px 0;">
              <a href="${reportUrl}" style="display:inline-block; background:#064e3b; color:#ffffff; border-radius:999px; padding:14px 22px; font-size:14px; font-weight:800; text-decoration:none;">
                Open business data generator
              </a>
            </p>
            <p style="margin:0; color:#78716c; font-size:13px; line-height:1.6;">
              Stripe may send a separate official receipt depending on your payment email settings.
            </p>
          </div>
        </div>
      </div>
    `,
    text: `Payment confirmed

Your ${siteName} credits are ready.

Package: ${bundleName}
Credits added: ${input.credits}
${amountText}
Open the business data generator:
${reportUrl}

Stripe may send a separate official receipt depending on your payment email settings.`
  });
}
