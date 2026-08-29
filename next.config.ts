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
    ];
  },
};

export default nextConfig;
