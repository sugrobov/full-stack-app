import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import Login from '../Login';
import authReducer from '../../store/authSlice';

vi.mock('axios');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createMockStore = (preloadedState) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: preloadedState },
  });

const renderLogin = (preloadedState = { user: null, token: null, isLoading: false, error: null }) => {
  const store = createMockStore(preloadedState);
  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>
    ),
    store,
  };
};

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    const { container } = renderLogin();
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('redirects to home if user already logged in', () => {
    renderLogin({ user: { id: 1, name: 'Test' }, token: 'abc', isLoading: false, error: null });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('calls login thunk and navigates on success', async () => {
    const store = createMockStore({ user: null, token: null, isLoading: false, error: null });
    axios.post.mockResolvedValueOnce({
      data: { token: 'abc', user: { id: 1, name: 'John', email: 'john@test.com' } },
    });

    const { container } = render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(container.querySelector('input[type="email"]'), { target: { value: 'test@test.com' } });
    fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(() => {
      expect(store.getState().auth.user).toEqual({ id: 1, name: 'John', email: 'john@test.com' });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error message when login fails', () => {
    const store = createMockStore({ user: null, token: null, isLoading: false, error: 'Неверный пароль' });
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </Provider>
    );
    expect(screen.getByText('Неверный пароль')).toBeInTheDocument();
  });

  it('disables button while loading', () => {
    renderLogin({ user: null, token: null, isLoading: true, error: null });
    const button = screen.getByRole('button', { name: /загрузка/i });
    expect(button).toBeDisabled();
  });

  it('has link to registration page', () => {
    renderLogin();
    const link = screen.getByRole('link', { name: /зарегистрироваться/i });
    expect(link).toHaveAttribute('href', '/register');
  });
});