import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    const button = container.firstChild;
    expect(button).toHaveClass('bg-red-600');
  });

  it('applies size classes', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    const button = container.firstChild;
    expect(button).toHaveClass('px-6', 'py-3', 'text-base');
  });

  it('shows spinner and hides children when loading', () => {
    const { container } = render(<Button isLoading>Submit</Button>);
    expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    // Spinner should be present
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  it('disables button when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    // The button element itself is disabled (via prop)
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} isLoading>Click</Button>);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders icon when provided', () => {
    const icon = <span data-testid="icon">⭐</span>;
    render(<Button icon={icon}>With icon</Button>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('With icon')).toBeInTheDocument();
  });

  it('does not render icon when loading', () => {
    const icon = <span data-testid="icon">⭐</span>;
    render(<Button icon={icon} isLoading>Loading</Button>);
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
  });
});