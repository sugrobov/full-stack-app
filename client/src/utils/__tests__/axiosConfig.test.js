import { vi } from 'vitest';
vi.unmock('axios');
import axios from 'axios';

const { mockDispatch, mockLogout } = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockLogout: vi.fn(() => ({ type: 'auth/logout' })),
}));

// Мок для store должен быть выполнен до всех импортов, чтобы перехватить загрузку реального store.js
vi.mock('../../store/store', () => ({
  default: {
    dispatch: mockDispatch,
    getState: vi.fn(),
    subscribe: vi.fn(),
  },
}));

// Мок для authSlice
vi.mock('../../store/authSlice', () => ({
  logout: mockLogout,
}));

import { logout } from '../../store/authSlice';

// Импортируем store (будет замокан)
import store from '../../store/store';

// Импортируем axiosConfig
import '../../utils/axiosConfig';

describe('axios interceptors', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('response interceptor success', () => {
    it('returns response as-is', () => {
      const response = { data: 'ok' };
      const interceptor = axios.interceptors.response.handlers[0];
      const result = interceptor.fulfilled(response);
      expect(result).toBe(response);
    });
  });

  describe('response interceptor error', () => {
    it('dispatches logout and redirects on 401', () => {
      const error = { response: { status: 401 } };
      const mockHref = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
      });
      const setHref = vi.spyOn(window.location, 'href', 'set');

      const interceptor = axios.interceptors.response.handlers[0];
      const result = interceptor.rejected(error);

      expect(store.dispatch).toHaveBeenCalledWith(logout());
      expect(setHref).toHaveBeenCalledWith('/login');
      return expect(result).rejects.toEqual(error);
    });

    it('rejects with error for non-401', () => {
      const error = { response: { status: 500 } };
      const interceptor = axios.interceptors.response.handlers[0];
      const result = interceptor.rejected(error);
      return expect(result).rejects.toEqual(error);
    });
  });
});