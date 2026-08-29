'use client';

import type { ButtonHTMLAttributes } from 'react';
import { nodeClasses, type NodeTone } from './Node';

/**
 * A button is the node treatment with press motion.
 *
 * On press it translates into its own shadow, which is what makes the hard
 * offset read as depth rather than as decoration.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: NodeTone;
}

/**
 * Defaults to the brighter accent (`--accent-strong`).
 *
 * The pale `--accent` is the reference's resting node fill; the bright one is
 * what it reserves for emphasis, which is what a primary action is. Both clear
 * AA against `--accent-foreground` and are contrast-checked in CI.
 */
export function Button({ tone = 'strong', className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={nodeClasses(
        tone,
        `px-3 py-1.5 text-sm font-medium transition-transform
         duration-(--duration-fast) ease-(--ease-out)
         active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
         focus-visible:outline-2 focus-visible:outline-offset-2
         focus-visible:outline-link
         disabled:cursor-not-allowed disabled:opacity-50 ${className}`,
      )}
    />
  );
}
