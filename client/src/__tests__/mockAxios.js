import { vi } from 'vitest';

export const mockGet = vi.fn();
export const mockPost = vi.fn();
export const mockPut = vi.fn();
export const mockPatch = vi.fn();
export const mockDelete = vi.fn();

export const mockAxios = {
  get: mockGet,
  post: mockPost,
  put: mockPut,
  patch: mockPatch,
  delete: mockDelete,
};