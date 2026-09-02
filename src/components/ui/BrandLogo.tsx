import Image from 'next/image';

export interface BrandLogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

/**
 * Brand wordmark that dynamically switches between light and dark versions
 * based on the document's active theme token attribute ([data-theme='dark']).
 *
 * In light mode: uses `/getcracked_logo_dark.svg` (dark lettering on light surface).
 * In dark mode: uses `/getcracked_logo_light.svg` (light lettering on dark surface).
 */
export function BrandLogo({
  width = 160,
  height = 50,
  className = 'h-10 w-auto',
  priority = false,
}: BrandLogoProps) {
  return (
    <span className="relative inline-flex items-center justify-center">
      {/* Light-theme logo (dark ink on light background) */}
      <Image
        src="/getcracked_logo_dark.svg"
        alt="GetCracked"
        width={width}
        height={height}
        className={`gc-logo-for-light-mode object-contain ${className}`}
        priority={priority}
      />
      {/* Dark-theme logo (light ink on dark background) */}
      <Image
        src="/getcracked_logo_light.svg"
        alt="GetCracked"
        width={width}
        height={height}
        className={`gc-logo-for-dark-mode object-contain ${className}`}
        priority={priority}
      />
    </span>
  );
}
