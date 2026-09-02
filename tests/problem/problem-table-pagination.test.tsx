import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProblemTable } from '@/components/problem/ProblemTable';
import type { Problem } from '@/content/schema';

function makeMockProblem(id: number): Problem {
  return {
    tier: 'problem',
    slug: `mock-problem-${id}`,
    topic: 'arrays',
    difficulty: 'easy',
    title: `Mock Problem ${id}`,
    companies: ['Amazon'],
    recommendedAfter: [],
    brief: 'A mock problem description.',
    hints: ['Hint 1', 'Hint 2'],
    starterCode: { javascript: 'function solve() {}' },
    referenceSolution: { javascript: 'function solve() { return 1; }' },
    complexity: { time: 'O(1)', space: 'O(1)', note: 'Constant' },
    testSpec: {
      entry: 'solve',
      cases: [{ args: [], expected: 1, hidden: false }],
    },
  };
}

describe('ProblemTable Pagination', () => {
  it('paginates problems and displays correct page slice and range', () => {
    const problems = Array.from({ length: 35 }, (_, i) => makeMockProblem(i + 1));

    render(<ProblemTable problems={problems} pageSize={15} />);

    // First page should show 1 to 15
    expect(screen.getByText('Mock Problem 1')).toBeInTheDocument();
    expect(screen.getByText('Mock Problem 15')).toBeInTheDocument();
    expect(screen.queryByText('Mock Problem 16')).not.toBeInTheDocument();

    // Range display
    expect(screen.getByText(/showing 1–15 of 35/i)).toBeInTheDocument();

    // Next page button
    const nextBtn = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextBtn);

    // Second page should show 16 to 30
    expect(screen.queryByText('Mock Problem 1')).not.toBeInTheDocument();
    expect(screen.getByText('Mock Problem 16')).toBeInTheDocument();
    expect(screen.getByText('Mock Problem 30')).toBeInTheDocument();
    expect(screen.getByText(/showing 16–30 of 35/i)).toBeInTheDocument();

    // Navigate to last page via page button
    const page3Btn = screen.getByRole('button', { name: 'Page 3' });
    fireEvent.click(page3Btn);

    // Third page should show 31 to 35
    expect(screen.getByText('Mock Problem 31')).toBeInTheDocument();
    expect(screen.getByText('Mock Problem 35')).toBeInTheDocument();
    expect(screen.getByText(/showing 31–35 of 35/i)).toBeInTheDocument();
  });
});
