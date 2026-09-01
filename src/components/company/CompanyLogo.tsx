'use client';

import { useState } from 'react';
import { getLogoDevUrl } from '@/lib/company-logo';

interface CompanyLogoProps {
  name: string;
  size?: number;
  className?: string;
  alt?: string;
}

const SIZE_CLASSES: Record<number, string> = {
  14: 'w-3.5 h-3.5 text-3xs',
  16: 'w-4 h-4 text-3xs',
  18: 'w-4.5 h-4.5 text-2xs',
  20: 'w-5 h-5 text-2xs',
  24: 'w-6 h-6 text-xs',
  28: 'w-7 h-7 text-xs',
  32: 'w-8 h-8 text-sm',
  40: 'w-10 h-10 text-base',
  48: 'w-12 h-12 text-lg',
  64: 'w-16 h-16 text-xl',
};

export function CompanyLogo({
  name,
  size = 24,
  className = '',
  alt,
}: CompanyLogoProps) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = getLogoDevUrl(name, size * 2);
  const sizeClass = SIZE_CLASSES[size] || 'w-6 h-6 text-xs';

  if (hasError) {
    // Graceful fallback: clean initial letter avatar without inline styles
    const initial = (name[0] || 'C').toUpperCase();
    return (
      <span
        className={`inline-flex items-center justify-center rounded-xs bg-surface-muted border border-border-subtle font-bold text-foreground shrink-0 select-none ${sizeClass} ${className}`}
        aria-label={alt || name}
      >
        {initial}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={alt || `${name} logo`}
      width={size}
      height={size}
      onError={() => setHasError(true)}
      className={`inline-block object-contain rounded-xs shrink-0 bg-white/5 ${sizeClass} ${className}`}
      loading="lazy"
    />
  );
}
