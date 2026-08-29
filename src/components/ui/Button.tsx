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

export function Button({ tone = 'accent', className = '', ...props }: ButtonProps) {
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
