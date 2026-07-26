import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../Pagination';

describe('Pagination', () => {
  it('returns null when totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} totalItems={5} itemsPerPage={10} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders pages and navigation buttons', () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} totalItems={45} itemsPerPage={10} />
    );
    expect(screen.getByText('Назад')).toBeInTheDocument();
    expect(screen.getByText('Вперед')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // current page
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} totalItems={25} itemsPerPage={10} />
    );
    expect(screen.getByText('Назад')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <Pagination currentPage={3} totalPages={3} onPageChange={vi.fn()} totalItems={25} itemsPerPage={10} />
    );
    expect(screen.getByText('Вперед')).toBeDisabled();
  });

  it('calls onPageChange with page number', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} totalItems={45} itemsPerPage={10} />
    );
    fireEvent.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByText('Вперед'));
    expect(onPageChange).toHaveBeenCalledWith(3);
    fireEvent.click(screen.getByText('Назад'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('does not call onPageChange for ellipsis', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={5} totalPages={10} onPageChange={onPageChange} totalItems={100} itemsPerPage={10} />
    );
    const ellipsisButtons = screen.getAllByText('...');
    ellipsisButtons.forEach(btn => fireEvent.click(btn));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('shows items range info', () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={vi.fn()} totalItems={45} itemsPerPage={10} />
    );
    expect(screen.getByText(/Показаны 11–20 из 45 товаров/)).toBeInTheDocument();
  });
});