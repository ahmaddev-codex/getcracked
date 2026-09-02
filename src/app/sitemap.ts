import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getcracked-dev.vercel.app';
  const lastModified = new Date();

  const routes = [
    { url: `${baseUrl}`, lastModified, changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/learn/visualizer`, lastModified, changeFrequency: 'weekly' as const, priority: 0.95 },
    { url: `${baseUrl}/learn/dsa`, lastModified, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/learn/system-design`, lastModified, changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${baseUrl}/problems`, lastModified, changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/companies`, lastModified, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${baseUrl}/challenges`, lastModified, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${baseUrl}/interviews`, lastModified, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${baseUrl}/learn/system-design/capacity`, lastModified, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/learn/system-design/canvas`, lastModified, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${baseUrl}/learn/system-design/labs`, lastModified, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${baseUrl}/sandbox`, lastModified, changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/leaderboard`, lastModified, changeFrequency: 'daily' as const, priority: 0.75 },
  ];

  return routes;
}
