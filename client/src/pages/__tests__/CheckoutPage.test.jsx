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
import CheckoutPage from '../CheckoutPage';

vi.mock('axios');
vi.mock('react-hot-toast');

const testProduct = {
  id: 1,
  name: 'Test Product',
  price: 100,
  discount_price: null,
  stock: 10,
  images: [],
};

// Напрямую задаём состояние корзины, чтобы контролировать quantity и totalPrice
const createStoreWithItems = (user = null, quantity = 2) => {
  const cartItem = {
    ...testProduct,
    quantity,
    totalPrice: testProduct.price * quantity,
  };
  return configureStore({
    reducer: { cart: cartReducer, auth: authReducer },
    preloadedState: {
      auth: { user, token: user ? 'token' : null },
      cart: user ? { items: [cartItem] } : { items: [] },
    },
  });
};

const renderCheckout = (store) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/" element={<div>Home</div>} />
          <Route path="/login" element={<div>Login</div>} />
          <Route path="/profile" element={<div>Profile</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

describe('CheckoutPage', () => {
  beforeEach(() => vi.clearAllMocks());

  test('redirects to home if cart is empty', () => {
    const store = configureStore({
      reducer: { cart: cartReducer, auth: authReducer },
      preloadedState: {
        auth: { user: { name: 'John' }, token: 'token' },
        cart: { items: [] },
      },
    });
    renderCheckout(store);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  test('redirects to login if user is not authenticated', () => {
    const store = configureStore({
      reducer: { cart: cartReducer, auth: authReducer },
      preloadedState: {
        auth: { user: null, token: null },
        cart: { items: [{ ...testProduct, quantity: 1, totalPrice: testProduct.price }] },
      },
    });
    renderCheckout(store);
    expect(screen.queryByText('Оформление заказа')).not.toBeInTheDocument();
  });

  test('renders order form when data is valid', () => {
    const store = createStoreWithItems({ name: 'John' });
    renderCheckout(store);
    expect(screen.getByText('Оформление заказа')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /подтвердить заказ/i })).toBeInTheDocument();
  });

  test('submits order successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { orderId: 123 } });
    const store = createStoreWithItems({ name: 'John' });
    renderCheckout(store);

    fireEvent.change(screen.getByLabelText('Ваше имя'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Адрес доставки/), { target: { value: 'Test Address' } });
    fireEvent.change(screen.getByLabelText('Телефон'), { target: { value: '1234567890' } });

    fireEvent.click(screen.getByRole('button', { name: /подтвердить заказ/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      const callArgs = axios.post.mock.calls[0];
      expect(callArgs[0]).toContain('/orders');
      expect(callArgs[1]).toMatchObject({
        name: 'John',
        address: 'Test Address',
        phone: '1234567890',
        items: [{ productId: 1, quantity: 2, price: 100 }],
      });
      expect(toast.success).toHaveBeenCalledWith('Заказ оформлен! Спасибо за покупку');
    });

    await waitFor(() => expect(screen.getByText('Profile')).toBeInTheDocument());
  });

  test('shows error message on failure', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { error: 'Серверная ошибка' } } });
    const store = createStoreWithItems({ name: 'John' });
    renderCheckout(store);

    fireEvent.change(screen.getByLabelText('Ваше имя'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Адрес доставки/), { target: { value: 'Address' } });

    fireEvent.click(screen.getByRole('button', { name: /подтвердить заказ/i }));

    await waitFor(() => expect(screen.getByText('Серверная ошибка')).toBeInTheDocument());
  });

  test('shows generic error if no server message', async () => {
    axios.post.mockRejectedValueOnce({});
    const store = createStoreWithItems({ name: 'John' });
    renderCheckout(store);

    fireEvent.change(screen.getByLabelText('Ваше имя'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Адрес доставки/), { target: { value: 'Address' } });

    fireEvent.click(screen.getByRole('button', { name: /подтвердить заказ/i }));

    await waitFor(() => expect(screen.getByText('Не удалось оформить заказ')).toBeInTheDocument());
  });

  test('disables submit button while loading', async () => {
    let resolvePromise;
    axios.post.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));
    const store = createStoreWithItems({ name: 'John' });
    renderCheckout(store);

    fireEvent.change(screen.getByLabelText('Ваше имя'), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Адрес доставки/), { target: { value: 'Address' } });

    const submitButton = screen.getByRole('button', { name: /подтвердить заказ/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();

    resolvePromise({ data: { orderId: 1 } });
    await waitFor(() => expect(screen.getByText('Profile')).toBeInTheDocument());
  });
});