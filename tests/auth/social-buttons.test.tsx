import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialButtons } from '@/components/auth/SocialButtons';

const social = vi.fn(async () => ({ error: null }));
vi.mock('@/lib/auth-client', () => ({
  signIn: {
    social: (...args: unknown[]) => social(...(args as [])),
  },
}));

/**
 * The rendered half of social sign-in (A2).
 *
 * `configuredProviders` decides *whether* a provider can work; this covers what
 * the page does with that answer. The two together are the guarantee that
 * matters: a learner is never shown a button that cannot complete.
 */
describe('social buttons', () => {
  const both = [
    { id: 'google', label: 'Google' },
    { id: 'github', label: 'GitHub' },
  ] as const;

  it('renders nothing at all when no provider is configured', () => {
    // Not an empty container with a divider — the "or" separator would imply a
    // choice that is not there.
    const { container } = render(<SocialButtons providers={[]} callbackURL="/" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one button per configured provider', () => {
    render(<SocialButtons providers={both} callbackURL="/" />);
    expect(screen.getByRole('button', { name: /continue with google/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeTruthy();
  });

  it('offers only what is configured', () => {
    render(<SocialButtons providers={[both[1]]} callbackURL="/" />);
    expect(screen.queryByRole('button', { name: /continue with google/i })).toBeNull();
    expect(screen.getByRole('button', { name: /continue with github/i })).toBeTruthy();
  });

  it('carries the page the learner came from through the redirect', async () => {
    // Sending everyone to the dashboard after an OAuth round trip loses their
    // place, and the reason to sign in is usually that they were mid-task.
    render(<SocialButtons providers={both} callbackURL="/learn/dsa/hashing" />);
    await userEvent.click(screen.getByRole('button', { name: /continue with google/i }));

    expect(social).toHaveBeenCalledWith({
      provider: 'google',
      callbackURL: '/learn/dsa/hashing',
    });
  });

  it('recovers when the provider call fails instead of spinning forever', async () => {
    social.mockResolvedValueOnce({ error: { message: 'Provider unavailable' } } as never);
    render(<SocialButtons providers={both} callbackURL="/" />);

    await userEvent.click(screen.getByRole('button', { name: /continue with github/i }));

    expect(await screen.findByText(/provider unavailable/i)).toBeTruthy();
    // Re-enabled, so the learner can try the other provider or the form below.
    expect(
      screen.getByRole('button', { name: /continue with github/i }).hasAttribute('disabled'),
    ).toBe(false);
  });
});
