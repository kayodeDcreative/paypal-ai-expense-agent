/**
 * Cloudflare Pages Functions - Middleware
 * 
 * This middleware runs on every request to:
 * 1. Add security headers
 * 2. Handle CORS
 * 3. Proxy API requests to the Worker backend
 */

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  // Add security headers
  let response = await context.next();

  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // CORS headers
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // CSP (Content Security Policy)
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
