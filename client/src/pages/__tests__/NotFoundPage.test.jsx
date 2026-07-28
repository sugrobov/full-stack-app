import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import NotFoundPage from '../NotFoundPage';

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>),
  },
}));

describe('NotFoundPage', () => {
  const renderNotFoundPage = () => {
    return render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
  };

  test('renders 404 page heading', () => {
    renderNotFoundPage();
    expect(screen.getByRole('heading', { name: /Страница не найдена/i })).toBeInTheDocument();
  });

  test('renders descriptive text', () => {
    renderNotFoundPage();
    expect(screen.getByText(/Извините, запрашиваемая страница не существует или была перемещена./i)).toBeInTheDocument();
  });

  test('renders links to home and catalog', () => {
    renderNotFoundPage();
    const homeLink = screen.getByRole('link', { name: /На главную/i });
    const catalogLink = screen.getByRole('link', { name: /В каталог/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
    expect(catalogLink).toBeInTheDocument();
    expect(catalogLink).toHaveAttribute('href', '/shop');
  });

  test('decorative elements are hidden from accessibility tree', () => {
    renderNotFoundPage();
    // Большое число 404 скрыто aria-hidden
    const big404 = screen.getByText('404');
    expect(big404).toHaveAttribute('aria-hidden', 'true');
    // Иконка-смайлик также скрыта (ближайший <div>)
    const iconContainer = document.querySelector('.w-24.h-24');
    expect(iconContainer).toHaveAttribute('aria-hidden', 'true');
  });
});