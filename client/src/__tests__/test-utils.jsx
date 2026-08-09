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

// Импортируем мок-функции из глобального __mocks__/axios
import { mockGet, mockPost, mockPut, mockDelete } from '../../__mocks__/axios';

// Устанавливаем безопасные реализации по умолчанию
mockGet.mockResolvedValue({ data: {} });
mockPost.mockResolvedValue({ data: {} });
mockPut.mockResolvedValue({ data: {} });
mockDelete.mockResolvedValue({ data: {} });

// Моки framer-motion и recaptcha
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    span: ({ children, ...props }) => React.createElement('span', props, children),
  },
  AnimatePresence: ({ children }) => children,
}));

vi.mock('react-google-recaptcha', () => ({
  default: (props) => <div data-testid="recaptcha-mock" {...props} />,
}));

// Экспорт для использования в интеграционных тестах
export const mockAxios = {
  get: mockGet,
  post: mockPost,
  put: mockPut,
  delete: mockDelete,
};

// Redux store и рендер-утилита
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