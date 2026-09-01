'use client';

import type { ComponentType } from 'react';
import {
  SiJavascript,
  SiTypescript,
  SiPython,
  SiCplusplus,
  SiGo,
} from 'react-icons/si';
import { FaJava } from 'react-icons/fa6';

interface LanguageIconProps {
  language: string;
  size?: number;
  className?: string;
}

const ICONS_BY_LANGUAGE: Record<
  string,
  ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
> = {
  javascript: SiJavascript,
  js: SiJavascript,
  typescript: SiTypescript,
  ts: SiTypescript,
  python: SiPython,
  py: SiPython,
  java: FaJava,
  cpp: SiCplusplus,
  'c++': SiCplusplus,
  go: SiGo,
  golang: SiGo,
};

/**
 * Renders an official programming language icon using the react-icons library.
 * Clean, compact, and compliant with design token constraints.
 */
export function LanguageIcon({ language, size = 13, className = '' }: LanguageIconProps) {
  const normalized = language.toLowerCase().trim();
  const IconComponent = ICONS_BY_LANGUAGE[normalized];

  if (!IconComponent) {
    return (
      <span className={`inline-block font-mono text-3xs font-bold uppercase ${className}`}>
        {language.slice(0, 2)}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center shrink-0 opacity-90 ${className}`}>
      <IconComponent size={size} aria-hidden />
    </span>
  );
}
