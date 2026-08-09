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

import { mockGet, mockPost, mockPut, mockPatch, mockDelete } from '../../__mocks__/axios';

// Безопасные умолчания
mockGet.mockResolvedValue({ data: {} });
mockPost.mockResolvedValue({ data: {} });
mockPut.mockResolvedValue({ data: {} });
mockPatch.mockResolvedValue({ data: {} });
mockDelete.mockResolvedValue({ data: {} });

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

export const mockAxios = {
  get: mockGet,
  post: mockPost,
  put: mockPut,
  patch: mockPatch,
  delete: mockDelete,
};

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