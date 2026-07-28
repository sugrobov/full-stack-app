import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import NewsPage from '../NewsPage';

// Мокаем framer-motion, чтобы избежать проблем с анимацией
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>),
  },
}));

// Создаём store с минимально необходимыми редьюсерами
const createTestStore = () =>
  configureStore({
    reducer: {
      auth: () => ({ token: null }),
      products: () => ({ items: [] }),
    },
  });

const renderNewsPage = () => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <NewsPage />
      </MemoryRouter>
    </Provider>
  );
};

describe('NewsPage', () => {
  test('renders category filter buttons', () => {
    renderNewsPage();
    expect(screen.getByTestId('category-filters')).toBeInTheDocument();
    const allButton = screen.getByRole('button', { name: /Все/i });
    expect(allButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Новинки/i })).toBeInTheDocument();
  });

  test('filters news by category', () => {
    renderNewsPage();
    const noveltiesButton = screen.getByRole('button', { name: /Новинки/i });
    fireEvent.click(noveltiesButton);
    const cards = screen.getAllByTestId(/news-card-/);
    expect(cards.length).toBe(2);
    expect(screen.getByText('Новая коллекция летней одежды')).toBeInTheDocument();
    expect(screen.getByText('Новые поступления: весенняя коллекция обуви')).toBeInTheDocument();
  });

  test('renders news cards with title and preview', () => {
    renderNewsPage();
    expect(screen.getByTestId('news-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('news-title-1')).toHaveTextContent('Новая коллекция летней одежды');
    expect(screen.getByTestId('news-preview-1')).toHaveTextContent('Лёгкие ткани, яркие цвета — встречайте лето стильно!');
  });

  test('pagination works correctly', () => {
    renderNewsPage();
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    const page2Button = screen.getByRole('button', { name: /Страница 2/i });
    fireEvent.click(page2Button);
    expect(screen.getByTestId('news-title-5')).toBeInTheDocument();
    expect(screen.getByTestId('news-title-6')).toBeInTheDocument();
  });

  test('previous and next buttons navigate pages', () => {
    renderNewsPage();
    const nextButton = screen.getByRole('button', { name: /Следующая страница/i });
    fireEvent.click(nextButton);
    expect(screen.getByTestId('news-title-5')).toBeInTheDocument();
    const prevButton = screen.getByRole('button', { name: /Предыдущая страница/i });
    fireEvent.click(prevButton);
    expect(screen.getByTestId('news-title-1')).toBeInTheDocument();
  });
});