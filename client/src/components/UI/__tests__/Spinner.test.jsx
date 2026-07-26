import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Spinner from '../Spinner';

describe('Spinner', () => {
  it('renders with default classes', () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild;
    expect(spinner).toHaveClass('inline-block', 'w-5', 'h-5', 'border-2', 'border-white', 'border-t-transparent', 'rounded-full', 'animate-spin');
  });

  it('applies custom size and color', () => {
    const { container } = render(<Spinner size="w-8 h-8" color="border-blue-500" />);
    const spinner = container.firstChild;
    expect(spinner).toHaveClass('w-8', 'h-8', 'border-blue-500');
  });
});