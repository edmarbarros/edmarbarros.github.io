const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface VerifyParams {
  secret: string;
  token: string;
  remoteIp?: string;
}

export async function verifyTurnstile({ secret, token, remoteIp }: VerifyParams): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.append('remoteip', remoteIp);

  try {
    const res = await fetch(SITEVERIFY, {
      method: 'POST',
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
