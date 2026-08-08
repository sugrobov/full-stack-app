import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import authReducer from '../store/authSlice';
import cartReducer from '../store/cartSlice';
import favoritesReducer from '../store/favoritesSlice';
import productsReducer from '../store/productsSlice';

// 1. Мок axios (настраиваемый)
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

// Устанавливаем безопасные реализации по умолчанию
mockGet.mockResolvedValue({ data: { products: [], totalPages: 0, currentPage: 1 } });
mockPost.mockResolvedValue({ data: {} });
mockPut.mockResolvedValue({ data: {} });
mockDelete.mockResolvedValue({ data: {} });

vi.mock('../utils/axiosConfig', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
  },
}));

// 2. Мок framer-motion (убирает анимации)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    span: ({ children, ...props }) => React.createElement('span', props, children),
    // можно добавить другие элементы при необходимости
  },
  AnimatePresence: ({ children }) => children,
}));

// 3. Мок GoogleReCaptcha
vi.mock('react-google-recaptcha', () => ({
  default: (props) => <div data-testid="recaptcha-mock" {...props} />,
}));

// Экспорт объекта для настройки в тестах
export const mockAxios = {
  get: mockGet,
  post: mockPost,
  put: mockPut,
  delete: mockDelete,
};

// 4. Базовая конфигурация store
const defaultReducers = {
  auth: authReducer,
  cart: cartReducer,
  favorites: favoritesReducer,
  products: productsReducer,
};

export function createMockStore(customReducers = {}, preloadedState = {}) {
  return configureStore({
    reducer: { ...defaultReducers, ...customReducers },
    preloadedState,
  });
}

// 5. Утилита рендера с провайдерами
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = createMockStore({}, preloadedState),
    initialEntries = ['/'],
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Экспортируем мок axios для индивидуальной настройки в тестах
export { mockAxios };