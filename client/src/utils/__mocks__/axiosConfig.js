import { vi } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

export default {
  get: mockGet,
  post: mockPost,
  put: mockPut,
  delete: mockDelete,
};

// Экспортируем сами функции для доступа из test-utils
export { mockGet, mockPost, mockPut, mockDelete };