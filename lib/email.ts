type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo
}: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.CONTACT_FROM_EMAIL?.trim() ??
    "Tech Revenue Brief <info@techrevenuebrief.com>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY missing; skipped email send", {
      to,
      subject
    });
    return { sent: false, skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      reply_to: replyTo
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Email send failed (${response.status}): ${body}`);
  }

  return { sent: true, skipped: false };
}
