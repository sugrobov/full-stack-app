import authReducer, { logout, clearError } from '../authSlice';
import { register, login, loadUser } from '../authSlice';

beforeEach(() => {
  localStorage.clear();
});

describe('authSlice', () => {
  describe('initial state', () => {
    it('should return null user and token', () => {
      const state = authReducer(undefined, { type: '@@INIT' });
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('logout reducer', () => {
    it('should clear user and token', () => {
      const previousState = {
        user: { id: 1, name: 'Test' },
        token: 'some-token',
        isLoading: false,
        error: null,
      };
      const state = authReducer(previousState, logout());
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
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

    it('should clear auth data on rejected', () => {
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
    });
  });
});