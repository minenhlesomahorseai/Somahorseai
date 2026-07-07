/**
 * Resolves the public base URL of the site for building absolute links in
 * emails and server-side flows. Set NEXT_PUBLIC_SITE_URL in production.
 */
export function siteBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function siteUrl(path: string): string {
  const base = siteBaseUrl();
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
