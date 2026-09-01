import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    /**
     * Avatar hosts, allowlisted to the two OAuth providers we support.
     *
     * `next/image` fetches and re-serves whatever URL it is handed, so a
     * permissive pattern here turns the image optimiser into an open proxy for
     * any URL that reaches a user row — and that column is populated from an
     * external profile, not by us.
     */
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'img.logo.dev' },
    ],
  },
  env: {
    NEXT_PUBLIC_LOGO_PUBLISHABLE_KEY:
      process.env.LOGO_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_LOGO_PUBLISHABLE_KEY ||
      '',
  },
  async redirects() {
    return [
      {
        /**
         * The concept map used to live at `/learn` (§2.1a). `/learn` is now a
         * hub over both tracks, so the old path is redirected permanently
         * rather than 404ing — it is one of the most-linked pages on the
         * existing site, and breaking those links would throw away exactly the
         * organic traffic the public-content decision was made to capture.
         */
        source: '/learn/concepts',
        destination: '/learn/system-design',
        permanent: true,
      },
      {
        /**
         * The `/learn` hub is gone — the site header now lists every track
         * directly, so a page whose only content was links to them was one
         * click of pure overhead.
         *
         * Redirected rather than left to 404 for the same reason as above: it
         * was linked from inside the product and is exactly the kind of path
         * that ends up in a bookmark. DSA is the destination because it is
         * where a learner with no other signal should start.
         */
        source: '/learn',
        destination: '/learn/dsa',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
