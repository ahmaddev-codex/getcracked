import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchTrigger } from '@/components/search/SearchTrigger';

// The dialog navigates on Enter; nothing here exercises that, but the hook must
// resolve for the component to render at all.
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

/**
 * Overlays must not inherit the chrome they were opened from.
 *
 * **The bug this exists for.** The search dialog is opened from the header, and
 * the header sets `text-header-foreground` on itself. As a DOM descendant, the
 * dialog inherited it — and in light mode that token and `--surface` are both
 * `#ffffff`, so every element inside that did not set its own colour rendered
 * white on white: the result titles, the filter chips, and the text being typed
 * into the search box.
 *
 * It was invisible in dark mode, where the header and body foregrounds happen to
 * hold the same value, so a dark-mode check would have passed. The contrast
 * harness could not see it either: both tokens are individually fine against
 * their own backgrounds, and nothing declared the pairing that was actually
 * rendered.
 *
 * So the property worth pinning is structural — an overlay is not a descendant
 * of the thing that opened it — rather than a colour comparison, which is what
 * already failed to catch it.
 */

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify({ entries: [] }), { status: 200 })),
  );
});

describe('the search dialog', () => {
  it('renders outside the header it is opened from', async () => {
    const user = userEvent.setup();

    const { container } = render(
      // The real arrangement: the trigger sits inside a header that sets a
      // foreground colour for its own dark bar.
      <header className="bg-header text-header-foreground">
        <SearchTrigger />
      </header>,
    );

    await user.click(screen.getByRole('button', { name: 'Search' }));

    const dialog = screen.getByRole('dialog', { name: 'Search' });
    expect(dialog).toBeInTheDocument();
    // The whole point: nothing in the dialog can inherit the header's colours,
    // because it is not inside the header.
    expect(container.querySelector('header')?.contains(dialog)).toBe(false);
  });

  it('declares its own foreground rather than relying on inheritance', async () => {
    // Belt and braces, and the same thing the account menu does. A portal makes
    // this redundant today; it stops the dialog being fragile if it ever moves.
    const user = userEvent.setup();
    render(<SearchTrigger />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(screen.getByRole('dialog', { name: 'Search' }).className).toContain(
      'text-foreground',
    );
  });

  it('closes on escape without leaving the overlay behind', async () => {
    // A portalled node is appended to the body, so a dialog that failed to
    // unmount would stay on screen over every page.
    const user = userEvent.setup();
    render(<SearchTrigger />);

    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Search' })).not.toBeInTheDocument();
  });
});
