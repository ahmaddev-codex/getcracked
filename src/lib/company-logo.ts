/**
 * Maps company names and slugs to primary domains for Logo.dev integration.
 */
export const COMPANY_DOMAINS: Record<string, string> = {
  amazon: 'amazon.com',
  google: 'google.com',
  meta: 'meta.com',
  microsoft: 'microsoft.com',
  apple: 'apple.com',
  netflix: 'netflix.com',
  uber: 'uber.com',
  bloomberg: 'bloomberg.com',
  adobe: 'adobe.com',
  'goldman sachs': 'goldmansachs.com',
  spotify: 'spotify.com',
  linkedin: 'linkedin.com',
  github: 'github.com',
};

/**
 * Resolves a company name, slug, or domain to its normalized primary web domain.
 */
export function getCompanyDomain(nameOrSlug: string): string {
  const normalized = nameOrSlug.toLowerCase().trim();
  if (COMPANY_DOMAINS[normalized]) {
    return COMPANY_DOMAINS[normalized];
  }
  // Strip special characters and default to .com
  const slug = normalized.replace(/[^a-z0-9]/g, '');
  return `${slug}.com`;
}

/**
 * Generates a logo.dev image URL for a given company or domain.
 * Supports publishable key passed via environment variables.
 */
export function getLogoDevUrl(domainOrName: string, size = 64): string {
  const domain = domainOrName.includes('.') ? domainOrName : getCompanyDomain(domainOrName);
  const token =
    process.env.NEXT_PUBLIC_LOGO_PUBLISHABLE_KEY ||
    process.env.LOGO_PUBLISHABLE_KEY ||
    '';

  const params = new URLSearchParams();
  if (size) params.set('size', String(size));
  params.set('format', 'png');
  if (token) params.set('token', token);

  const query = params.toString();
  return `https://img.logo.dev/${domain}${query ? `?${query}` : ''}`;
}
