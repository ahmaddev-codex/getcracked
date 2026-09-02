'use client';

import Image from 'next/image';
import { useAssistant } from './AssistantContext';

export function AssistantFloatingButton() {
  const { isOpen, openAssistant, closeAssistant } = useAssistant();

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <button
        type="button"
        onClick={() => (isOpen ? closeAssistant() : openAssistant())}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open GetCracked AI Assistant'}
        title="Ask GetCracked AI"
        className="group relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-border-strong bg-surface shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong active:scale-95"
      >
        <Image
          src="/getcracked_favicon.svg"
          alt="GetCracked AI"
          width={26}
          height={26}
          className="transition-transform duration-200 group-hover:scale-110"
        />
        {/* Glow ring */}
        <span
          className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-accent-strong/40 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden
        />
      </button>
    </div>
  );
}
