export function pickAllowedOrigin(requestOrigin: string | null, allowedList: string): string | null {
  if (!requestOrigin) return null;
  const allowed = allowedList.split(',').map((s) => s.trim()).filter(Boolean);
  return allowed.includes(requestOrigin) ? requestOrigin : null;
}

export function corsHeaders(origin: string): HeadersInit {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

export function preflight(origin: string): Response {
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}
