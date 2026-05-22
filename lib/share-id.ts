import { randomBytes } from "crypto";

const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateShareId(length = 8) {
  const bytes = randomBytes(length);

  const shareId = Array.from(bytes)
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");

  if (!/^[a-z0-9]+$/.test(shareId)) {
    throw new Error("Generated share_id must be lowercase alphanumeric only");
  }

  return shareId;
}
