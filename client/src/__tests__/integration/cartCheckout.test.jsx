import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';
import { vi } from 'vitest';
import cartReducer from '../../store/cartSlice';
import authReducer from '../../store/authSlice';
import CartPage from '../../pages/CartPage';
import CheckoutPage from '../../pages/CheckoutPage';

vi.mock('axios');
vi.mock('react-hot-toast');

describe('Cart → Checkout integration', () => {
  const testProduct = {
    id: 1,
    name: 'Test Product',
    price: 100,
    discount_price: null,
    stock: 10,
    quantity: 2,
    images: [],
    totalPrice: 200,
  };

  const createTestStore = () =>
    configureStore({
      reducer: { cart: cartReducer, auth: authReducer },
      preloadedState: {
        cart: { items: [testProduct] },
        auth: {
          user: { id: 1, name: 'John', email: 'john@example.com' },
          token: 'test-token',
        },
      },
    });

  beforeEach(() => vi.clearAllMocks());

  const renderApp = (store) =>
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/cart']}>
          <Routes>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/" element={<div>Home Page</div>} />
            <Route path="/profile" element={<div>Profile Page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

  test('full flow: cart → checkout → submit order', async () => {
    const store = createTestStore();
    axios.post.mockResolvedValueOnce({ data: { orderId: 123 } });

    renderApp(store);

    // 1. Корзина: видим товар и сумму
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    const priceElements = screen.getAllByText(/200/);
    expect(priceElements.length).toBeGreaterThanOrEqual(1);

    // 2. Переходим к оформлению
    fireEvent.click(screen.getByText('Оформить заказ'));

    // 3. Дождались страницы оформления
    await waitFor(() => {
      expect(screen.getByText(/Оформление заказа/i)).toBeInTheDocument();
    });

    // 4. Проверяем итоговую сумму
    const checkoutPriceElements = screen.getAllByText(/200/);
    expect(checkoutPriceElements.length).toBeGreaterThanOrEqual(1);

    // 5. Заполняем поля формы
    fireEvent.change(screen.getByLabelText('Ваше имя'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '+79001234567' } });
    fireEvent.change(screen.getByLabelText(/Адрес доставки/), { target: { value: 'ул. Пушкина, д. 10' } });
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'john@example.com' } });

    // 6. Отправляем заказ
    fireEvent.click(screen.getByText('Подтвердить заказ'));

    // 7. Проверяем вызов axios.post с правильными данными
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/orders'),
        expect.objectContaining({
          items: [{ productId: 1, quantity: 2, price: 100 }],
          name: 'John',
          phone: '+79001234567',
          address: 'ул. Пушкина, д. 10',
          email: 'john@example.com',
        }),
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith('Заказ успешно оформлен');
    });

    // 8. Редирект на главную (так настроен CheckoutPage)
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });
});