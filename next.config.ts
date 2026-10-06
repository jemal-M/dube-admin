import type { NextConfig } from "next"

/**
 * Static export: `next build` writes a plain HTML/CSS/JS site to `out/`.
 * Every page is prerendered at build time; all data is fetched in the browser
 * from the Laravel API, so the panel can be hosted on any CDN or Nginx.
 */
const nextConfig: NextConfig = {
  output: "export",
  // `/merchants/` → `merchants/index.html`, which every static host serves without rewrites.
  trailingSlash: true,
  images: { unoptimized: true },
  // Dev only: let phones/laptops on the LAN open `next dev` via this machine's IP.
  // Each `*` matches one label, so these cover the private IPv4 ranges.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*"],
}

export default nextConfig
