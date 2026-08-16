import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react'; // добавлен within
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import HomePage from '../HomePage';
import authReducer from '../../store/authSlice';

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>),
    h1: React.forwardRef(({ children, ...props }, ref) => <h1 ref={ref} {...props}>{children}</h1>),
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHomePage = () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { user: null, token: null, isLoading: false, error: null } },
    });
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      </Provider>
    );
  };

  test('renders hero section with heading and buttons', () => {
    renderHomePage();
    expect(screen.getByRole('heading', { name: /Всё, что вам нужно/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Перейти в магазин/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Войти \/ Регистрация/i })).toBeInTheDocument();
  });

  test('renders advantages section', () => {
    renderHomePage();
    expect(screen.getByText(/Быстрая доставка/i)).toBeInTheDocument();
    expect(screen.getByText(/Лёгкий возврат/i)).toBeInTheDocument();
    expect(screen.getByText(/Безопасная оплата/i)).toBeInTheDocument();
    expect(screen.getByText(/Оригинальные товары/i)).toBeInTheDocument();
  });

  test('renders promotions section', () => {
    renderHomePage();
    const promotionsSection = screen.getByRole('region', { name: /Акции и предложения/i });
    expect(within(promotionsSection).getByText(/Весенняя распродажа/i)).toBeInTheDocument();
    expect(within(promotionsSection).getByText(/Подарок при заказе/i)).toBeInTheDocument();
    expect(within(promotionsSection).getByText(/Бесплатная доставка/i)).toBeInTheDocument();
    const detailLinks = within(promotionsSection).getAllByRole('link', { name: /Подробнее/i });
    expect(detailLinks).toHaveLength(3);
  });

  test('renders news section with links', () => {
    renderHomePage();
    expect(screen.getByText(/Новая коллекция летней одежды/i)).toBeInTheDocument();
    expect(screen.getByText(/Скидка 20% на электронику/i)).toBeInTheDocument();
    expect(screen.getByText(/Бесплатная доставка от 3000₽/i)).toBeInTheDocument();
    const readMoreLinks = screen.getAllByRole('link', { name: /Читать →/i });
    expect(readMoreLinks).toHaveLength(3);
  });

  test('renders subscription form and submits', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderHomePage();
    const emailInput = screen.getByLabelText(/Ваш email/i);
    const submitButton = screen.getByRole('button', { name: /Подписаться/i });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    expect(alertMock).toHaveBeenCalledWith('Функция подписки в разработке');
  });

  test('navigation links have correct paths', () => {
    renderHomePage();
    expect(screen.getByRole('link', { name: /Перейти в магазин/i })).toHaveAttribute('href', '/shop');
    expect(screen.getByRole('link', { name: /Войти \/ Регистрация/i })).toHaveAttribute('href', '/login');
    const newsLinks = screen.getAllByRole('link', { name: /Читать →/i });
    expect(newsLinks[0]).toHaveAttribute('href', '/news');
  });
});