import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Header from '../Header';
import cartReducer from '../../store/cartSlice';
import favoritesReducer from '../../store/favoritesSlice';
import authReducer from '../../store/authSlice';
import productsReducer from '../../store/productsSlice';

// Мокаем ConfirmModal, чтобы просто отображать children или проверять пропсы
vi.mock('../UI/ConfirmModal', () => ({
  default: ({ isOpen, onConfirm, onClose, title, message, confirmText }) =>
    isOpen ? (
      <div data-testid="confirm-modal">
        <p>{title}</p>
        <p>{message}</p>
        <button onClick={onConfirm}>{confirmText}</button>
        <button onClick={onClose}>Отмена</button>
      </div>
    ) : null,
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
      auth: authReducer,
      cart: cartReducer,
      favorites: favoritesReducer,
      products: productsReducer,
    },
    preloadedState,
  });

const renderHeader = (preloadedState) => {
  const store = createMockStore(preloadedState);
  return {
    ...render(
      <Provider store={store}>
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      </Provider>
    ),
    store,
  };
};

const defaultState = {
  auth: { user: null, token: null, isLoading: false, error: null },
  cart: { items: [], totalQuantity: 0 },
  favorites: { items: [] },
  products: {
    items: [], currentProduct: null, status: 'idle', error: null,
    categories: [], currentPage: 1, itemsPerPage: 12, totalPages: 1, totalItems: 0,
    minPrice: '', maxPrice: '', selectedCategory: '', sort: 'default',
  },
};

describe('Header component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo and navigation links', () => {
    renderHeader(defaultState);
    expect(screen.getByText('Лого')).toBeInTheDocument();
    expect(screen.getByText('Магазин')).toBeInTheDocument();
  });

  it('shows cart and favorites counters as zero initially', () => {
    renderHeader(defaultState);
    // Иконки есть, но каунтеры не отображаются, так как нет количества
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows favorites count when items exist', () => {
    const state = {
      ...defaultState,
      favorites: { items: [1, 2, 3] },
    };
    renderHeader(state);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows cart total quantity', () => {
    const state = {
      ...defaultState,
      cart: { items: [{ id: 1, quantity: 2 }], totalQuantity: 2 },
    };
    renderHeader(state);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('shows login/register buttons for unauthenticated user', () => {
    renderHeader(defaultState);
    expect(screen.getByText('Войти')).toBeInTheDocument();
    expect(screen.getByText('Регистрация')).toBeInTheDocument();
  });

  it('shows user name and logout button when authenticated', () => {
    const state = {
      ...defaultState,
      auth: { ...defaultState.auth, user: { id: 1, name: 'Иван', role: 'user' } },
    };
    renderHeader(state);
    expect(screen.getByText('Привет, Иван')).toBeInTheDocument();
    expect(screen.getByText('Профиль')).toBeInTheDocument();
    expect(screen.queryByText('Войти')).not.toBeInTheDocument();
  });

  it('shows admin link for admin user', () => {
    const state = {
      ...defaultState,
      auth: { ...defaultState.auth, user: { id: 2, name: 'Admin', role: 'admin' } },
    };
    renderHeader(state);
    expect(screen.getByText('Админка')).toBeInTheDocument();
  });

  it('opens logout confirmation modal and performs logout', async () => {
    const state = {
      ...defaultState,
      auth: { ...defaultState.auth, user: { id: 1, name: 'Иван', role: 'user' } },
    };
    renderHeader(state);

    // Кликаем основную кнопку "Выйти" (которая в хедере)
    fireEvent.click(screen.getByText('Выйти'));

    // Модальное окно должно появиться
    const modal = screen.getByTestId('confirm-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Подтверждение выхода')).toBeInTheDocument();

    // Ищем кнопку подтверждения именно внутри модального окна
    const confirmButton = within(modal).getByText('Выйти');
    fireEvent.click(confirmButton);

    // Проверяем, что был осуществлён переход на главную
    expect(mockNavigate).toHaveBeenCalledWith('/');
    // Модальное окно должно закрыться (не обязательно проверять, но можно)
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });
});