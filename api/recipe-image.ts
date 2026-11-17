// Searches Pixabay server-side and streams the image back from our own origin, so the
// API key never ships to the browser and the CDN caches the bytes instead of hotlinking.
import { json } from './_lib/http.js';

const ONE_WEEK = 60 * 60 * 24 * 7;

async function handler(request: Request): Promise<Response> {
  const headers = { 'Content-Type': 'application/json' };
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, headers);

  const key = process.env.PIXABAY_API_KEY ?? process.env.VITE_PIXABAY_API_KEY;
  const q = new URL(request.url).searchParams.get('q')?.trim().slice(0, 80);
  if (!key || !q) return json({ error: 'Not found' }, 404, headers);

  try {
    const search = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(q)}&image_type=photo&category=food&per_page=3&safesearch=true&min_width=400`,
    );
    if (!search.ok) return json({ error: 'Not found' }, 404, headers);
    const data = (await search.json()) as { hits?: Array<{ webformatURL: string }> };
    const src = data.hits?.[0]?.webformatURL;
    if (!src) {
      return json({ error: 'Not found' }, 404, { ...headers, 'Cache-Control': `public, s-maxage=${60 * 60 * 24}` });
    }

    const img = await fetch(src);
    if (!img.ok || !img.body) return json({ error: 'Not found' }, 404, headers);
    return new Response(img.body, {
      status: 200,
      headers: {
        'Content-Type': img.headers.get('content-type') ?? 'image/jpeg',
        'Cache-Control': `public, max-age=${ONE_WEEK}, s-maxage=${ONE_WEEK * 4}, immutable`,
        'X-Image-Source': 'Pixabay',
      },
    });
  } catch (err) {
    console.error('recipe-image failed', err);
    return json({ error: 'Not found' }, 404, headers);
  }
}

// Vercel's web-standard signature: one named export per HTTP method, each receiving a
// fetch Request. (A default-export function is called Node-style with (req, res).)
export const GET = handler;
