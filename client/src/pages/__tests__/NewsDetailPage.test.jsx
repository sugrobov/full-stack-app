import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import NewsDetailPage from '../NewsDetailPage';

// Мокаем framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>),
  },
}));

// Мокаем Breadcrumb, чтобы не зависеть от роутинга
vi.mock('../components/Breadcrumb', () => ({
  default: () => <nav data-testid="breadcrumb">Breadcrumb</nav>,
}));

describe('NewsDetailPage', () => {
  const renderWithRouter = (id) => {
    return render(
      <MemoryRouter initialEntries={[`/news/${id}`]}>
        <NewsDetailPage />
      </MemoryRouter>
    );
  };

  test('renders news detail for existing news (id=1)', () => {
    renderWithRouter(1);
    expect(screen.getByRole('heading', { name: /Новая коллекция летней одежды/i })).toBeInTheDocument();
    expect(screen.getByText(/Новинки/i)).toBeInTheDocument();
    expect(screen.getByText(/10 мая 2025 г\./i)).toBeInTheDocument();
    expect(screen.getByText(/Лёгкие ткани, яркие цвета — встречайте лето стильно!/i)).toBeInTheDocument();
    expect(screen.getByText(/Мы рады представить новую коллекцию/i)).toBeInTheDocument();
    // Ссылки
    expect(screen.getByRole('link', { name: /← Все новости/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Вернуться к списку новостей/i })).toBeInTheDocument();
  });

  test('shows not found message for non-existing news (id=999)', () => {
    renderWithRouter(999);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Новость не найдена/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Все новости/i })).toBeInTheDocument();
  });

  test('renders breadcrumb component', () => {
    renderWithRouter(1);
    expect(screen.getByTestId('breadcrumb')).toBeInTheDocument();
  });

  test('renders back to news link with correct href', () => {
    renderWithRouter(1);
    const backLink = screen.getByRole('link', { name: /← Все новости/i });
    expect(backLink).toHaveAttribute('href', '/news');
    const topLink = screen.getByRole('link', { name: /Вернуться к списку новостей/i });
    expect(topLink).toHaveAttribute('href', '/news');
  });
});