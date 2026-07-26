import axios from 'axios';
vi.mock('axios');
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
    it('should dispatch fulfilled with user data on successful login (integration)', async () => {
      const fakeUser = { id: 1, name: 'Test', email: 'test@test.com', role: 'user' };
      const fakeToken = 'fake-jwt';
      axios.post.mockResolvedValueOnce({ data: { token: fakeToken, user: fakeUser } });

      const dispatch = vi.fn();
      const thunk = login({ email: 'test@test.com', password: '123456' });
      await thunk(dispatch, () => ({}), undefined);

      const fulfilledAction = dispatch.mock.calls.find(
        call => call[0].type === login.fulfilled.type
      );
      expect(fulfilledAction[0].payload).toEqual({ token: fakeToken, user: fakeUser });
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        { email: 'test@test.com', password: '123456' }
      );
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

    it('should dispatch rejected when token is missing in store', async () => {
      const dispatch = vi.fn();
      const getState = vi.fn(() => ({ auth: { token: null } }));
      const thunk = loadUser();
      await thunk(dispatch, getState, undefined);

      const rejectedAction = dispatch.mock.calls.find(
        call => call[0].type === loadUser.rejected.type
      );
      expect(rejectedAction).toBeDefined();
      expect(rejectedAction[0].error.message).toBe('No token');
    });

  });
});