import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import CheckoutPage from '../CheckoutPage';
import cartReducer from '../../store/cartSlice';
import authReducer from '../../store/authSlice';
import toast from 'react-hot-toast';

vi.mock('axios');
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createMockStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      cart: cartReducer,
      auth: authReducer,
    },
    preloadedState,
  });

const renderCheckout = (customState = {}) => {
  const store = createMockStore(customState);
  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <CheckoutPage />
        </MemoryRouter>
      </Provider>
    ),
    store,
  };
};

const baseItem = {
  id: 1,
  name: 'Тестовый товар',
  price: 1000,
  discountPrice: null,
  quantity: 2,
  image: null,
  images: [],
  totalPrice: 2000,
};

const loggedInState = {
  auth: { user: { id: 1, name: 'User' }, token: 'token123' },
  cart: { items: [baseItem], totalQuantity: 2 },
};

describe('CheckoutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to home if cart is empty', () => {
    renderCheckout({ auth: { user: { id: 1 }, token: 'abc' }, cart: { items: [], totalQuantity: 0 } });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('redirects to login if user is not authenticated', () => {
    renderCheckout({ auth: { user: null, token: null }, cart: { items: [baseItem], totalQuantity: 1 } });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders order summary and form when data is valid', () => {
    const { container } = renderCheckout(loggedInState);
    expect(screen.getByText('Оформление заказа')).toBeInTheDocument();
    expect(screen.getByText('Тестовый товар x 2')).toBeInTheDocument();
    // Итоговая сумма computedTotal (2000)
    expect(screen.getAllByText('2,000 ₽')[0]).toBeInTheDocument();
    // Поля ввода
    expect(container.querySelector('input[type="text"]')).toBeInTheDocument(); // адрес
    expect(container.querySelector('input[type="tel"]')).toBeInTheDocument(); // телефон
    expect(screen.getByRole('button', { name: /подтвердить заказ/i })).toBeInTheDocument();
  });

  it('submits order successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: {} });
    const { store, container } = renderCheckout(loggedInState);

    fireEvent.change(container.querySelector('input[type="text"]'), { target: { value: 'Улица Пушкина' } });
    fireEvent.change(container.querySelector('input[type="tel"]'), { target: { value: '+79991234567' } });
    fireEvent.click(screen.getByRole('button', { name: /подтвердить заказ/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      const callArgs = axios.post.mock.calls[0];
      expect(callArgs[0]).toContain('/orders');
      expect(callArgs[1]).toMatchObject({
        address: 'Улица Пушкина',
        phone: '+79991234567',
        items: [{ productId: 1, quantity: 2, price: 1000 }],
      });
      expect(store.getState().cart.items).toHaveLength(0);
      expect(mockNavigate).toHaveBeenCalledWith('/profile?orderSuccess=true');
      expect(toast.success).toHaveBeenCalledWith('Заказ оформлен! Спасибо за покупку');
    });
  });

  it('shows error message on failure', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { error: 'Серверная ошибка' } } });
    const { container } = renderCheckout(loggedInState);

    fireEvent.change(container.querySelector('input[type="text"]'), { target: { value: 'Адрес' } });
    fireEvent.click(screen.getByRole('button', { name: /подтвердить заказ/i }));

    await waitFor(() => {
      expect(screen.getByText('Серверная ошибка')).toBeInTheDocument();
    });
  });

  it('shows generic error if no server message', async () => {
    axios.post.mockRejectedValueOnce({});
    const { container } = renderCheckout(loggedInState);
    fireEvent.change(container.querySelector('input[type="text"]'), { target: { value: 'Адрес' } });
    fireEvent.click(screen.getByRole('button', { name: /подтвердить заказ/i }));

    await waitFor(() => {
      expect(screen.getByText('Не удалось оформить заказ')).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    axios.post.mockImplementation(() => new Promise(() => {}));
    const { container } = renderCheckout(loggedInState);

    fireEvent.change(container.querySelector('input[type="text"]'), { target: { value: 'Адрес' } });
    const submitButton = screen.getByRole('button', { name: /подтвердить заказ/i });
    fireEvent.click(submitButton);
    expect(submitButton).toBeDisabled();
  });
});