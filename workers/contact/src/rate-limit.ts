const MAX_PER_HOUR = 5;
const TTL_SECONDS = 60 * 60;

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
}

/** Count one use of `key` against `max` per `ttlSeconds`. Counting starts at the first use. */
export async function checkLimit(
  kv: KVNamespace,
  key: string,
  max: number,
  ttlSeconds: number,
): Promise<RateLimitResult> {
  const current = await kv.get(key);
  const count = current ? Number.parseInt(current, 10) || 0 : 0;
  if (count >= max) {
    return { allowed: false, count, limit: max };
  }
  const next = count + 1;
  await kv.put(key, String(next), { expirationTtl: ttlSeconds });
  return { allowed: true, count: next, limit: max };
}

/** The contact form: 5 submissions per hour per IP. */
export function checkRateLimit(kv: KVNamespace, ip: string): Promise<RateLimitResult> {
  return checkLimit(kv, `contact:${ip}`, MAX_PER_HOUR, TTL_SECONDS);
}
