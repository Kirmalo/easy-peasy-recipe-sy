// Shared helpers for /api routes. Files under api/_lib are not deployed as endpoints.

/**
 * Origins allowed to call the API from a browser. Same-origin requests are always allowed.
 * Set ALLOWED_ORIGINS="https://example.com,https://www.example.com" to add more.
 */
function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function sameOrigin(request: Request, origin: string): boolean {
  try {
    const reqHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host;
    return new URL(origin).host === reqHost;
  } catch {
    return false;
  }
}

/** True when the request either has no Origin (non-browser / same-origin GET) or an allowed one. */
export function originAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  if (sameOrigin(request, origin)) return true;
  const list = allowedOrigins();
  if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return list.includes(origin.replace(/\/$/, ''));
}

export function corsHeaders(request: Request, methods: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': `${methods}, OPTIONS`,
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
  const origin = request.headers.get('origin');
  if (origin && originAllowed(request)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

export function json(body: unknown, status: number, headers: Record<string, string>, extra?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });
}

/** Client IP as seen by the platform. Vercel sets x-real-ip; never trust a client-supplied XFF chain first. */
export function clientIp(request: Request): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ??
    'unknown'
  );
}

export const hasRedis = (): boolean =>
  Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// Redis keys for community recipe votes.
export const VOTES_KEY = 'ep:community:upvotes';
export const REPORTS_KEY = 'ep:community:reports';

/**
 * Error body for a failed request. Preview and local deployments include the underlying
 * message to make debugging possible without the logs; production keeps it generic.
 */
export function errorBody(message: string, err: unknown): { error: string; detail?: string } {
  if (process.env.VERCEL_ENV === 'production') return { error: message };
  const detail = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return { error: message, detail: detail.slice(0, 500) };
}
