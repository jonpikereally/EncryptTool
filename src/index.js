/**
 * EncryptYourLife worker.
 *
 * Serves the static advisor from the ASSETS binding, adds the standard
 * security-header set, and generates robots.txt / sitemap.xml from the live
 * hostname so staging and production are both correct without a second config.
 *
 * The site itself is deliberately inert: no APIs, no storage, no third-party
 * origins. The CSP below is what enforces that.
 */

import buildInfo from "../public/build-info.json";

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = {
  "Content-Security-Policy": CSP,
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": [
    "accelerometer=()",
    "camera=()",
    "geolocation=()",
    "gyroscope=()",
    "interest-cohort=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
  ].join(", "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};

/** Pages that belong in the sitemap. The app is a single document. */
const SITEMAP_PATHS = ["/"];

function siteUrl(env, request) {
  const configured = (env.SITE_URL || "").trim().replace(/\/+$/, "");
  if (configured) return configured;
  return new URL(request.url).origin;
}

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function textResponse(body, contentType) {
  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/** Rewrites the placeholder origin baked into the HTML to the live origin. */
class AbsoluteUrl {
  constructor(attribute, origin) {
    this.attribute = attribute;
    this.origin = origin;
  }

  element(element) {
    const value = element.getAttribute(this.attribute);
    if (!value) return;
    element.setAttribute(this.attribute, value.replace("https://encrypttool.invalid", this.origin));
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = siteUrl(env, request);

    if (url.pathname === "/__build") {
      return withSecurityHeaders(
        new Response(JSON.stringify(buildInfo, null, 2), {
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        }),
      );
    }

    if (url.pathname === "/robots.txt") {
      return withSecurityHeaders(
        textResponse(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, "text/plain; charset=utf-8"),
      );
    }

    if (url.pathname === "/sitemap.xml") {
      const lastmod = (buildInfo.buildDate || new Date().toISOString()).slice(0, 10);
      const entries = SITEMAP_PATHS.map(
        (path) =>
          `  <url>\n    <loc>${origin}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n  </url>`,
      ).join("\n");
      return withSecurityHeaders(
        textResponse(
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`,
          "application/xml; charset=utf-8",
        ),
      );
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const contentType = assetResponse.headers.get("Content-Type") || "";

    if (contentType.includes("text/html")) {
      const rewritten = new HTMLRewriter()
        .on('link[rel="canonical"]', new AbsoluteUrl("href", origin))
        .on('meta[property="og:url"]', new AbsoluteUrl("content", origin))
        .on('meta[property="og:image"]', new AbsoluteUrl("content", origin))
        .on('meta[name="twitter:image"]', new AbsoluteUrl("content", origin))
        .transform(assetResponse);
      return withSecurityHeaders(rewritten);
    }

    return withSecurityHeaders(assetResponse);
  },
};
