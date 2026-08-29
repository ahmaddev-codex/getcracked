import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from '@/app/page';

describe('Home page', () => {
  it('renders the product name as the top-level heading', () => {
    render(<Page />);

    expect(
      screen.getByRole('heading', { level: 1, name: /getcracked/i }),
    ).toBeInTheDocument();
  });

  it('renders the product tagline', () => {
    render(<Page />);

    expect(screen.getByText(/build real systems/i)).toBeInTheDocument();
  });
});
