import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import Page from '@/app/page';
import { catalogCounts } from '@/lib/catalog';
import { conceptCount } from '@/content/concepts';
import { getLabs } from '@/content/registry';

/**
 * The landing page.
 *
 * It used to assert that the `h1` said "GetCracked". It no longer does, and that
 * is the improvement rather than a regression: the wordmark is in the header on
 * every page, so spending the one `h1` on it says nothing a visitor did not
 * already know and nothing a search engine can use. The heading is now what the
 * product does.
 *
 * What is worth pinning instead is the thing most likely to rot — **the numbers
 * are counted, not written down.** A marketing page is the most tempting place
 * to round up and the last place anyone revisits, so these assert against the
 * same functions the page calls.
 */
describe('the landing page', () => {
  it('leads with what the product does, not its own name', () => {
    render(<Page />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(/build real systems/i);
  });

  it('has exactly one top-level heading', () => {
    // Several `h1`s on the page a search engine lands on is the one structural
    // mistake worth a test here.
    render(<Page />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('reports counts derived from the catalogue rather than hardcoded', () => {
    const counts = catalogCounts();
    render(<Page />);

    // If someone writes a number in by hand, it disagrees with this the first
    // time content lands — which is the whole point.
    for (const value of [counts.lessons, counts.problems, counts.challengeSteps]) {
      expect(screen.getAllByText(String(value)).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText(String(conceptCount())).length).toBeGreaterThan(0);
    expect(screen.getAllByText(String(getLabs().length)).length).toBeGreaterThan(0);
  });

  it('offers a way into each of the three tiers', () => {
    // The page is structured around the tiers (AD-7); a tier with no entry point
    // is a tier a visitor cannot reach from the front door.
    render(<Page />);

    for (const href of ['/learn/dsa', '/problems', '/challenges']) {
      expect(
        screen.getAllByRole('link').some((a) => a.getAttribute('href') === href),
        href,
      ).toBe(true);
    }
  });

  it('says an account is not needed, where a visitor will see it', () => {
    // The most common reason to bounce from a learning site is not knowing
    // whether a sign-up wall is coming. The answer is no, and §2.6 means it has
    // to stay no — so this fails if the sentence quietly disappears.
    render(<Page />);
    const banner = screen.getByRole('heading', { level: 1 }).closest('header');
    expect(banner).not.toBeNull();
    expect(within(banner!).getByText(/without an account/i)).toBeInTheDocument();
  });

  it('does not promise the pricing will never change', () => {
    // §2.6 as amended: free at launch, a paid tier planned and undesigned.
    // "Free forever" on the landing page would be the easiest thing to write
    // and a promise nobody has made.
    render(<Page />);
    expect(document.body.textContent ?? '').not.toMatch(/free forever|always free|never pay/i);
  });
});
