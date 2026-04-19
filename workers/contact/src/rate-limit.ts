const MAX_PER_HOUR = 5;
const TTL_SECONDS = 60 * 60;

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
}

export async function checkRateLimit(kv: KVNamespace, ip: string): Promise<RateLimitResult> {
  const key = `contact:${ip}`;
  const current = await kv.get(key);
  const count = current ? Number.parseInt(current, 10) || 0 : 0;
  if (count >= MAX_PER_HOUR) {
    return { allowed: false, count, limit: MAX_PER_HOUR };
  }
  const next = count + 1;
  await kv.put(key, String(next), { expirationTtl: TTL_SECONDS });
  return { allowed: true, count: next, limit: MAX_PER_HOUR };
}
