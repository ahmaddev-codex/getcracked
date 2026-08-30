import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { methodLabel } from '@/lib/account';
import { AccountMenu } from '@/components/auth/AccountMenu';

const signOut = vi.fn(async () => ({}));
const refresh = vi.fn();
const push = vi.fn();

vi.mock('@/lib/auth-client', () => ({
  signOut: () => signOut(),
  useSession: () => ({ data: null, isPending: false }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh, push }),
}));

/**
 * The account menu (A2).
 *
 * Sign-out had no entry point anywhere in the product: a learner could create
 * an account and then had no way out of it short of clearing cookies. On a
 * shared machine that is a real problem, not an inconvenience — so these tests
 * treat "there is a way out" as the property under test.
 */
describe('account menu', () => {
  it('offers a way to sign out', async () => {
    render(<AccountMenu email="learner@example.com" name="Test Learner" />);

    await userEvent.click(screen.getByRole('button', { name: /test learner/i }));
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeTruthy();
  });

  it('signs out and refreshes, because the session lives on the server', async () => {
    render(<AccountMenu email="learner@example.com" name="Test Learner" />);

    await userEvent.click(screen.getByRole('button', { name: /test learner/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));

    expect(signOut).toHaveBeenCalled();
    // Navigating alone would render the signed-in shell from cache.
    expect(refresh).toHaveBeenCalled();
  });

  it('shows the email, since two accounts on one machine is common', async () => {
    render(<AccountMenu email="learner@example.com" name="Test Learner" />);
    await userEvent.click(screen.getByRole('button', { name: /test learner/i }));
    expect(screen.getByText('learner@example.com')).toBeTruthy();
  });

  it('falls back to the email when there is no name', () => {
    render(<AccountMenu email="learner@example.com" name={null} />);
    expect(screen.getByRole('button', { name: /learner@example\.com/i })).toBeTruthy();
  });

  it('closes on Escape, so the menu is not a trap', async () => {
    render(<AccountMenu email="learner@example.com" name="Test Learner" />);
    await userEvent.click(screen.getByRole('button', { name: /test learner/i }));
    expect(screen.queryByRole('menu')).toBeTruthy();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
  });
});

describe('sign-in method labels', () => {
  it('names the password method in words a learner uses', () => {
    // "credential" is Better Auth's internal name and means nothing to anyone.
    expect(methodLabel('credential')).toBe('Email and password');
  });

  it('capitalises a provider', () => {
    expect(methodLabel('google')).toBe('Google');
    expect(methodLabel('github')).toBe('Github');
  });
});
