type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function nowMs() {
  return Date.now();
}

function getClientKey(request: Request, prefix: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const ip = forwarded || realIp || "unknown";
  const sessionKey = request.headers.get("x-trb-session")?.trim() || "anon";

  return `${prefix}:${ip}:${sessionKey}`;
}

export function getClientIdentity(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();

  return {
    ip: forwarded || realIp || "unknown",
    sessionKey: request.headers.get("x-trb-session")?.trim() || "anon"
  };
}

export function checkKeyedRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const current = nowMs();
  const existing = buckets.get(input.key);

  if (!existing || current >= existing.resetAt) {
    buckets.set(input.key, { count: 1, resetAt: current + input.windowMs });
    return { allowed: true, remaining: input.limit - 1 };
  }

  if (existing.count >= input.limit) {
    return { allowed: false, remaining: 0, retryAfterMs: existing.resetAt - current };
  }

  existing.count += 1;
  buckets.set(input.key, existing);

  return { allowed: true, remaining: input.limit - existing.count };
}

export function checkRateLimit(input: {
  request: Request;
  prefix: string;
  limit: number;
  windowMs: number;
}) {
  const key = getClientKey(input.request, input.prefix);
  return checkKeyedRateLimit({
    key,
    limit: input.limit,
    windowMs: input.windowMs
  });
}
