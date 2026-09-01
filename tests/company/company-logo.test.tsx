import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { getCompanyDomain, getLogoDevUrl } from '@/lib/company-logo';
import { CompanyLogo } from '@/components/company/CompanyLogo';

describe('Company Logo & Logo.dev Integration', () => {
  describe('getCompanyDomain', () => {
    it('maps known companies to their official domains', () => {
      expect(getCompanyDomain('Meta')).toBe('meta.com');
      expect(getCompanyDomain('netflix')).toBe('netflix.com');
      expect(getCompanyDomain('Google')).toBe('google.com');
      expect(getCompanyDomain('Amazon')).toBe('amazon.com');
      expect(getCompanyDomain('Apple')).toBe('apple.com');
      expect(getCompanyDomain('Microsoft')).toBe('microsoft.com');
      expect(getCompanyDomain('Uber')).toBe('uber.com');
      expect(getCompanyDomain('Goldman Sachs')).toBe('goldmansachs.com');
    });

    it('handles custom or unknown company names gracefully', () => {
      expect(getCompanyDomain('ByteDance')).toBe('bytedance.com');
      expect(getCompanyDomain('OpenAI')).toBe('openai.com');
    });
  });

  describe('getLogoDevUrl', () => {
    it('builds standard logo.dev url with size and png format', () => {
      const url = getLogoDevUrl('meta.com', 48);
      expect(url).toContain('https://img.logo.dev/meta.com');
      expect(url).toContain('format=png');
      expect(url).toContain('size=48');
    });

    it('resolves company name to domain before building URL', () => {
      const url = getLogoDevUrl('Netflix');
      expect(url).toContain('https://img.logo.dev/netflix.com');
    });
  });

  describe('CompanyLogo Component', () => {
    it('renders img with logo.dev src', () => {
      render(<CompanyLogo name="Meta" size={32} />);
      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('src')).toContain('https://img.logo.dev/meta.com');
    });

    it('falls back to letter avatar on error', () => {
      render(<CompanyLogo name="Meta" size={32} />);
      const img = screen.getByRole('img');
      fireEvent.error(img);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
    });
  });
});
