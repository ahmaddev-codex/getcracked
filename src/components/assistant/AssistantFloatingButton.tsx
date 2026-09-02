'use client';

import Image from 'next/image';
import { useAssistant } from './AssistantContext';

export function AssistantFloatingButton() {
  const { isOpen, openAssistant, closeAssistant } = useAssistant();

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <div className="gc-shiny-ring-wrapper group transition-transform duration-200 hover:scale-105 active:scale-95">
        {/* Animated shiny travelling ring */}
        <div className="gc-shiny-ring-spinner" aria-hidden />

        {/* The Action Button */}
        <button
          type="button"
          onClick={() => (isOpen ? closeAssistant() : openAssistant())}
          aria-label={isOpen ? 'Close AI Assistant' : 'Open GetCracked AI Assistant'}
          title="Ask GetCracked AI"
          className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black overflow-hidden p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
        >
          <Image
            src="/getcracked_assistant.svg"
            alt="GetCracked AI"
            width={48}
            height={48}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </button>
      </div>
    </div>
  );
}
