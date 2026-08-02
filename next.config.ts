import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export. The whole architecture depends on this: the build emits
  // plain files to `out/`, which are served from S3 behind CloudFront. There is
  // no Node server at runtime, so there are no cold starts and no request-time
  // attack surface. Anything dynamic (stock, cart, checkout) is fetched in the
  // browser from the Bacano API — see README "What is static vs live".
  output: "export",

  // Static export has no image optimizer, so `next/image` cannot resize on
  // demand. Product images come already sized from the Bacano storage CDN.
  images: {
    unoptimized: true,
  },

  // S3 + CloudFront serve `/about/index.html` for `/about/` but 404 for
  // `/about`. Trailing slashes keep the generated links and the objects in the
  // bucket in agreement.
  trailingSlash: true,

  // A type error must fail the build rather than ship broken HTML to every
  // visitor. This is the default, stated explicitly so nobody "temporarily"
  // disables it.
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
