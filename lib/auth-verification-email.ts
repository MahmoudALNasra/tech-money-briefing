import { sendEmail } from "@/lib/email";
import { absoluteUrl, siteConfig } from "@/lib/site";

const recommendedArticles = [
  {
    title: "Who are my local competitors?",
    href: "/digital-marketing/who-are-my-local-competitors-how-to-build-a-useful-competitor-list",
    image: "/generated/article-who-are-my-local-competitors-how-to-build-a-useful-competitor-list.svg"
  },
  {
    title: "Local competitor analysis checklist",
    href: "/seo/local-competitor-analysis-checklist-for-small-businesses",
    image: "/generated/article-local-competitor-analysis-checklist-for-small-businesses.svg"
  },
  {
    title: "Build a local lead list from competitor research",
    href: "/startups/how-to-build-a-local-lead-list-from-competitor-research",
    image: "/generated/article-how-to-build-a-local-lead-list-from-competitor-research.svg"
  }
];

function articleLinksHtml() {
  return recommendedArticles
    .map(
      (article) => `
        <a href="${absoluteUrl(article.href)}" style="display:block; margin:0 0 14px; overflow:hidden; border:1px solid #e7e5e4; border-radius:18px; text-decoration:none; color:#1c1917;">
          <img src="${absoluteUrl(article.image)}" alt="" width="560" style="display:block; width:100%; max-width:560px; height:auto; border:0;" />
          <span style="display:block; padding:14px 16px; color:#047857; font-size:14px; font-weight:800; line-height:1.4;">
            ${article.title}
          </span>
        </a>
      `
    )
    .join("");
}

function articleLinksText() {
  return recommendedArticles
    .map((article) => `- ${article.title}: ${absoluteUrl(article.href)}`)
    .join("\n");
}

export async function sendVerificationEmail(input: {
  to: string;
  verificationUrl: string;
}) {
  const siteName = siteConfig.name;
  const logoUrl = absoluteUrl("/logo.svg");
  const homeUrl = siteConfig.url;
  const subject = `${siteName} - verify your email`;

  return sendEmail({
    to: input.to,
    subject,
    html: `
      <div style="margin:0; padding:0; background:#f5f5f4; font-family: Arial, Helvetica, sans-serif; color:#1c1917;">
        <div style="max-width:640px; margin:0 auto; padding:32px 18px;">
          <div style="background:#ffffff; border:1px solid #e7e5e4; border-radius:28px; padding:32px;">
            <a href="${homeUrl}" style="display:inline-block; margin:0 0 28px;">
              <img src="${logoUrl}" alt="${siteName}" width="180" style="display:block; max-width:180px; height:auto; border:0;" />
            </a>
            <p style="margin:0 0 10px; color:#78716c; font-size:12px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase;">
              Verify your account
            </p>
            <h1 style="margin:0; font-size:28px; line-height:1.2; color:#1c1917;">
              Welcome to ${siteName}
            </h1>
            <p style="margin:18px 0 0; color:#57534e; font-size:16px; line-height:1.6;">
              Confirm your email so we can protect your account, save your reports, and attach credits to the right workspace.
            </p>
            <p style="margin:28px 0;">
              <a href="${input.verificationUrl}" style="display:inline-block; background:#064e3b; color:#ffffff; border-radius:999px; padding:14px 22px; font-size:14px; font-weight:800; text-decoration:none;">
                Verify your email
              </a>
              <a href="${homeUrl}" style="display:inline-block; margin-left:10px; color:#047857; border:1px solid #a7f3d0; border-radius:999px; padding:13px 18px; font-size:14px; font-weight:800; text-decoration:none;">
                Open ${siteName}
              </a>
            </p>
            <p style="margin:0; color:#78716c; font-size:13px; line-height:1.6;">
              If the button does not work, paste this link into your browser:<br />
              <a href="${input.verificationUrl}" style="color:#047857; word-break:break-all;">${input.verificationUrl}</a>
            </p>
            <div style="margin-top:30px; padding-top:24px; border-top:1px solid #e7e5e4;">
              <p style="margin:0 0 12px; font-size:14px; font-weight:800; color:#1c1917;">
                While you are here, read a few useful guides:
              </p>
              ${articleLinksHtml()}
            </div>
            <p style="margin:28px 0 0; color:#a8a29e; font-size:12px; line-height:1.5;">
              You can always open the web app here:
              <a href="${homeUrl}" style="color:#047857; font-weight:700;">${homeUrl}</a>
            </p>
          </div>
        </div>
      </div>
    `,
    text: `Welcome to ${siteName}

Verify your email:
${input.verificationUrl}

Open ${siteName}:
${homeUrl}

Useful guides:
${articleLinksText()}

${siteName} - ${homeUrl}`
  });
}
