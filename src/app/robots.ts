import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getcracked-dev.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/learn',
          '/learn/dsa',
          '/learn/system-design',
          '/learn/visualizer',
          '/problems',
          '/challenges',
          '/companies',
          '/interviews',
          '/leaderboard',
          '/sandbox',
        ],
        disallow: ['/api/', '/account', '/dashboard'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
