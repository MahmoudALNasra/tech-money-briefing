import { randomBytes } from "crypto";

const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateSubscriberId(length = 8) {
  const bytes = randomBytes(length);
  const subscriberId = Array.from(bytes)
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");

  if (!/^[a-z0-9]{8}$/.test(subscriberId)) {
    throw new Error("Generated subscriber id must be 8 lowercase alphanumeric characters");
  }

  return subscriberId;
}
