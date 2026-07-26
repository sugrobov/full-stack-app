import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import Register from '../Register';
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

const renderRegister = (preloadedState = { user: null, token: null, isLoading: false, error: null }) => {
  const store = createMockStore(preloadedState);
  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    ),
    store,
  };
};

describe('Register page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders registration form', () => {
    const { container } = renderRegister();
    expect(container.querySelector('input[type="text"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="email"]')).toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /зарегистрироваться/i })).toBeInTheDocument();
  });

  it('redirects if already logged in', () => {
    renderRegister({ user: { id: 1 }, token: 'token', isLoading: false, error: null });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('dispatches register and navigates on success', async () => {
    const store = createMockStore({ user: null, token: null, isLoading: false, error: null });
    axios.post.mockResolvedValueOnce({
      data: { token: 'abc', user: { id: 1, name: 'John', email: 'john@test.com' } },
    });

    const { container } = render(
      <Provider store={store}>
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      </Provider>
    );

    fireEvent.change(container.querySelector('input[type="text"]'), { target: { value: 'John' } });
    fireEvent.change(container.querySelector('input[type="email"]'), { target: { value: 'john@test.com' } });
    fireEvent.change(container.querySelector('input[type="password"]'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(() => {
      expect(store.getState().auth.user).toEqual({ id: 1, name: 'John', email: 'john@test.com' });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error from store', () => {
    renderRegister({ user: null, token: null, isLoading: false, error: 'Email занят' });
    expect(screen.getByText('Email занят')).toBeInTheDocument();
  });

  it('disables button when loading', () => {
    renderRegister({ user: null, token: null, isLoading: true, error: null });
    const button = screen.getByRole('button', { name: /загрузка/i });
    expect(button).toBeDisabled();
  });

  it('has link to login page', () => {
    renderRegister();
    const link = screen.getByRole('link', { name: /войти/i });
    expect(link).toHaveAttribute('href', '/login');
  });
});