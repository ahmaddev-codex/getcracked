import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
