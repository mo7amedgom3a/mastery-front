// Public media Worker: serves the R2 bucket `mastery-public-bucket` (Course Studio, blog and lab
// images) at https://media.emasteryacademy.com and keeps responses in the Cloudflare edge cache.
//
// Object keys are written once by the backend (`<prefix>/<owner>/<uuid>.<ext>`) and never
// overwritten, so a found object is cached as immutable for a year. Misses are cached briefly so a
// broken link doesn't hit R2 on every view. Only GET/HEAD are served; uploads go to R2 directly
// through presigned URLs from the API.

const IMMUTABLE = "public, max-age=31536000, immutable";
const NOT_FOUND = "public, max-age=60";

/** @param {string} pathname */
function objectKey(pathname) {
  let key;
  try {
    key = decodeURIComponent(pathname.replace(/^\/+/, ""));
  } catch {
    return null;
  }
  if (!key || key.length > 1024 || key.includes("..") || key.startsWith("_")) return null;
  return key;
}

/** @param {Headers} headers */
function withCommonHeaders(headers) {
  headers.set("access-control-allow-origin", "*");
  headers.set("x-content-type-options", "nosniff");
  headers.set("timing-allow-origin", "*");
  return headers;
}

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: withCommonHeaders(new Headers({ "cache-control": NOT_FOUND, "content-type": "text/plain" })),
  });
}

const worker = {
  /**
   * @param {Request} request
   * @param {{ MEDIA_BUCKET: any }} env
   * @param {{ waitUntil(promise: Promise<unknown>): void }} ctx
   */
  async fetch(request, env, ctx) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }
    const url = new URL(request.url);
    const key = objectKey(url.pathname);
    if (!key) return notFound();

    // The cache key ignores the query string: objects never change, so `?v=` adds nothing.
    const cacheKey = new Request(`${url.origin}/${key}`, { method: "GET" });
    const cache = caches.default;
    const ranged = request.headers.has("range");

    // cache.match answers Range and conditional requests from the cached full object.
    const cached = await cache.match(new Request(cacheKey, { headers: request.headers }));
    if (cached) return request.method === "HEAD" ? new Response(null, cached) : cached;

    const object = await env.MEDIA_BUCKET.get(key, ranged ? { range: request.headers } : undefined);
    if (!object) {
      const response = notFound();
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    }

    const headers = withCommonHeaders(new Headers());
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", IMMUTABLE);
    headers.set("accept-ranges", "bytes");

    if (ranged && object.range) {
      const { offset = 0, length = object.size - offset } = object.range;
      headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
      headers.set("content-length", String(length));
      return new Response(request.method === "HEAD" ? null : object.body, { status: 206, headers });
    }

    headers.set("content-length", String(object.size));
    const response = new Response(object.body, { status: 200, headers });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return request.method === "HEAD" ? new Response(null, response) : response;
  },
};

export default worker;
