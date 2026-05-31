import { describe, it, expect, vi, beforeEach } from 'vitest';
import authReducer, { logout, clearError } from '../authSlice';
import { register, login, loadUser } from '../authSlice';

// Мок localStorage (используем настоящий jsdom localStorage, который доступен в vitest с environment: jsdom)
const localStorageMock = {
  getItem: vi.spyOn(Storage.prototype, 'getItem'),
  setItem: vi.spyOn(Storage.prototype, 'setItem'),
  removeItem: vi.spyOn(Storage.prototype, 'removeItem'),
  clear: vi.spyOn(Storage.prototype, 'clear'),
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('authSlice', () => {
  describe('initial state', () => {
    it('should return null user and token when localStorage is empty', () => {
      const state = authReducer(undefined, { type: '@@INIT' });
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('logout reducer', () => {
    it('should clear user, token and remove from localStorage', () => {
      const previousState = {
        user: { id: 1, name: 'Test' },
        token: 'some-token',
        isLoading: false,
        error: null,
      };
      const state = authReducer(previousState, logout());
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });

  describe('clearError reducer', () => {
    it('should set error to null', () => {
      const previousState = {
        user: null,
        token: null,
        isLoading: false,
        error: 'Some error',
      };
      const state = authReducer(previousState, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('register thunk', () => {
    const responseData = {
      token: 'new-token',
      user: { id: 1, name: 'John', email: 'john@test.com', role: 'user' },
    };

    it('should set isLoading true on pending', () => {
      const state = authReducer(undefined, register.pending());
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set user and token on fulfilled', () => {
      const state = authReducer(undefined, register.fulfilled(responseData));
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(responseData.user);
      expect(state.token).toBe(responseData.token);
      // localStorage.save происходит в thunk'е, а не в редьюсере – здесь не проверяем
    });

    it('should set error on rejected', () => {
      const error = new Error('Registration failed');
      const state = authReducer(undefined, register.rejected(error));
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(error.message);
    });
  });

  describe('login thunk', () => {
    const responseData = {
      token: 'login-token',
      user: { id: 1, name: 'John', email: 'john@test.com', role: 'user' },
    };

    it('should set isLoading true on pending', () => {
      const state = authReducer(undefined, login.pending());
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set user and token on fulfilled', () => {
      const state = authReducer(undefined, login.fulfilled(responseData));
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(responseData.user);
      expect(state.token).toBe(responseData.token);
    });

    it('should set error on rejected', () => {
      const error = new Error('Invalid credentials');
      const state = authReducer(undefined, login.rejected(error));
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(error.message);
    });
  });

  describe('loadUser thunk', () => {
    const user = { id: 1, name: 'John', email: 'john@test.com', role: 'user' };

    it('should set isLoading true on pending', () => {
      const state = authReducer(undefined, loadUser.pending());
      expect(state.isLoading).toBe(true);
    });

    it('should update user on fulfilled', () => {
      const state = authReducer(undefined, loadUser.fulfilled(user));
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(user);
    });

    it('should clear auth data and localStorage on rejected', () => {
      const previousState = {
        user: { id: 1, name: 'Existing' },
        token: 'old-token',
        isLoading: false,
        error: null,
      };
      const state = authReducer(previousState, loadUser.rejected());
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });
});