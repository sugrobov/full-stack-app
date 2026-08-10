import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Создаём мок-функции, которые будут доступны через импорт axiosConfig
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();

// Глобальный мок модуля axiosConfig
vi.mock('../utils/axiosConfig', () => ({
  default: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,
    delete: mockDelete,
    // Если interceptors используются
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));