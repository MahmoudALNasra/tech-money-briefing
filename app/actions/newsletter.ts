"use server";

import { generateSubscriberId } from "@/lib/subscriber-id";
import { supabase } from "@/lib/supabase";

type NewsletterActionState = {
  ok: boolean;
  message: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function subscribeToNewsletter(
  formData: FormData
): Promise<NewsletterActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const source = String(formData.get("source") ?? "homepage_grid")
    .trim()
    .slice(0, 80);

  if (!emailRegex.test(email)) {
    return {
      ok: false,
      message: "Please enter a valid email address."
    };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { error } = await supabase.from("subscribers").insert({
      id: generateSubscriberId(),
      email,
      source: source || "homepage_grid"
    });

    if (!error) {
      return {
        ok: true,
        message: "Subscribed successfully!"
      };
    }

    if (error.code === "23505" && error.message.includes("email")) {
      return {
        ok: false,
        message: "Email already registered."
      };
    }

    if (error.code !== "23505") {
      return {
        ok: false,
        message: "Could not subscribe right now. Please try again."
      };
    }
  }

  return {
    ok: false,
    message: "Could not generate subscriber id. Please try again."
  };
}
