"use server";

import { sendEmail } from "@/lib/email";
import { supabase } from "@/lib/supabase";

type ContactActionState = {
  ok: boolean;
  message: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const allowedTopics = new Set([
  "help",
  "strategy",
  "correction",
  "source",
  "sponsorship",
  "partnership",
  "other"
]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function submitContactForm(
  formData: FormData
): Promise<ContactActionState> {
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const company = String(formData.get("company") ?? "").trim().slice(0, 160);
  const topic = String(formData.get("topic") ?? "help").trim();
  const pageUrl = String(formData.get("page_url") ?? "").trim().slice(0, 500);
  const message = String(formData.get("message") ?? "").trim().slice(0, 4000);
  const source = String(formData.get("source") ?? "contact_page")
    .trim()
    .slice(0, 80);

  if (!name) {
    return { ok: false, message: "Please enter your name." };
  }

  if (!emailRegex.test(email)) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  if (!allowedTopics.has(topic)) {
    return { ok: false, message: "Please choose a contact reason." };
  }

  if (message.length < 20) {
    return {
      ok: false,
      message: "Please add a little more detail so we can help."
    };
  }

  const insertPayload = {
    name,
    email,
    company: company || null,
    topic,
    page_url: pageUrl || null,
    message,
    source: source || "contact_page"
  };

  const { error } = await supabase.from("contact_submissions").insert(insertPayload);

  if (error) {
    console.error("[contact] insert failed", error.message);
    return {
      ok: false,
      message: "Could not submit right now. Please email info@techrevenuebrief.com."
    };
  }

  const to = process.env.CONTACT_TO_EMAIL?.trim() || "info@techrevenuebrief.com";
  const subject = `Tech Revenue Brief contact: ${topic} - ${name}`;
  const html = `
    <h2>New contact submission</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Company/site:</strong> ${escapeHtml(company || "Not provided")}</p>
    <p><strong>Topic:</strong> ${escapeHtml(topic)}</p>
    <p><strong>Page URL:</strong> ${escapeHtml(pageUrl || "Not provided")}</p>
    <p><strong>Source:</strong> ${escapeHtml(source || "contact_page")}</p>
    <h3>Message</h3>
    <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
  `;
  const text = [
    "New contact submission",
    `Name: ${name}`,
    `Email: ${email}`,
    `Company/site: ${company || "Not provided"}`,
    `Topic: ${topic}`,
    `Page URL: ${pageUrl || "Not provided"}`,
    `Source: ${source || "contact_page"}`,
    "",
    message
  ].join("\n");

  try {
    await sendEmail({
      to,
      subject,
      html,
      text,
      replyTo: email
    });
  } catch (emailError) {
    console.error(
      "[contact] email failed",
      emailError instanceof Error ? emailError.message : emailError
    );
    return {
      ok: true,
      message:
        "Saved. Email delivery had an issue, but your message is stored and we will review it."
    };
  }

  return {
    ok: true,
    message: "Thanks. Your message was sent to info@techrevenuebrief.com."
  };
}
