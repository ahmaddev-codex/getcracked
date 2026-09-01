import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssistantProvider, useAssistant } from '@/components/assistant/AssistantContext';
import { AssistantPanel } from '@/components/assistant/AssistantPanel';
import { AssistantTrigger } from '@/components/assistant/AssistantTrigger';

function TestWrapper({
  children,
  initialOpen = false,
}: {
  children?: React.ReactNode;
  initialOpen?: boolean;
}) {
  return (
    <AssistantProvider>
      <TestOpener initialOpen={initialOpen} />
      {children}
      <AssistantPanel />
    </AssistantProvider>
  );
}

function TestOpener({ initialOpen }: { initialOpen: boolean }) {
  const { openAssistant } = useAssistant();
  React.useEffect(() => {
    if (initialOpen) openAssistant();
  }, [initialOpen, openAssistant]);
  return null;
}

import React from 'react';

describe('Assistant UI (Module L)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        signedIn: true,
        configured: true,
        limit: 10,
        remaining: 8,
        reset: Date.now() + 50000,
      }),
      headers: new Headers({ 'X-RateLimit-Remaining': '8' }),
    });
  });

  it('renders nothing when closed', async () => {
    await act(async () => {
      render(<TestWrapper initialOpen={false} />);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens and renders assistant panel with title and AI transparency disclaimer (L10)', async () => {
    await act(async () => {
      render(<TestWrapper initialOpen={true} />);
    });

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/getcracked assistant/i)).toBeTruthy();
    expect(screen.getByText(/powered by groq/i)).toBeTruthy();
    expect(screen.getByText(/verify critical code/i)).toBeTruthy();
  });

  it('renders quick prompts on fresh open', async () => {
    await act(async () => {
      render(<TestWrapper initialOpen={true} />);
    });

    expect(screen.getByText(/give me a hint/i)).toBeTruthy();
    expect(screen.getByText(/debug test case/i)).toBeTruthy();
    expect(screen.getByText(/time complexity/i)).toBeTruthy();
  });

  it('opens when AssistantTrigger is clicked', async () => {
    await act(async () => {
      render(
        <TestWrapper initialOpen={false}>
          <AssistantTrigger label="Ask AI" />
        </TestWrapper>,
      );
    });

    expect(screen.queryByRole('dialog')).toBeNull();

    const btn = screen.getByRole('button', { name: /ask ai/i });
    await userEvent.click(btn);

    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
