import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../Input';

describe('Input', () => {
  it('renders text input by default', () => {
    const { container } = render(<Input />);
    const input = container.querySelector('input[type="text"]');
    expect(input).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Email" id="email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor', () => {
    render(<Input label="Name" id="name" />);
    const input = screen.getByLabelText('Name');
    expect(input).toBeInTheDocument();
  });

  it('shows required asterisk in label', () => {
    render(<Input label="Password" id="pwd" required />);
    const label = screen.getByText('Password');
    // label contains an asterisk span
    expect(label.querySelector('.text-red-500')).toHaveTextContent('*');
  });

  it('renders textarea when type is textarea', () => {
    const { container } = render(<Input type="textarea" label="Message" id="msg" />);
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBe(textarea);
  });

  it('calls onChange handler', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = document.querySelector('input');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('displays error message', () => {
    render(<Input error="Required field" />);
    expect(screen.getByText('Required field')).toBeInTheDocument();
  });

  it('applies error border class when error is set', () => {
    const { container } = render(<Input error="Some error" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('border-red-500');
  });

  it('passes additional props to input', () => {
    render(<Input placeholder="Search..." />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('uses id if provided, otherwise name for label association', () => {
    render(<Input label="Username" name="username" />);
    // label htmlFor will be "username" because id is not provided
    const input = screen.getByLabelText('Username');
    expect(input).toHaveAttribute('name', 'username');
    expect(input).toHaveAttribute('id', 'username');
  });
});