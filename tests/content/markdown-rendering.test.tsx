import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Markdown } from '@/components/Markdown';

describe('Markdown rendering', () => {
  it('renders GFM markdown tables as proper HTML tables', () => {
    const tableMarkdown = `
| Goal | What to Study | How to Practice |
|------|---------------|----------------|
| Syntax | JavaScript | Solve warm-up problems |
| Big-O | Time/Space | Write complexity notes |
    `;

    render(<Markdown>{tableMarkdown}</Markdown>);

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(screen.getByText('Goal')).toBeInTheDocument();
    expect(screen.getByText('What to Study')).toBeInTheDocument();
    expect(screen.getByText('Syntax')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
  });

  it('renders headings, lists, and bold text cleanly', () => {
    const content = `
## Foundations Layer
- Step 1: Learn arrays
- Step 2: Learn hashing
    `;

    render(<Markdown>{content}</Markdown>);

    expect(screen.getByRole('heading', { level: 2, name: 'Foundations Layer' })).toBeInTheDocument();
    expect(screen.getByText('Step 1: Learn arrays')).toBeInTheDocument();
  });
});
