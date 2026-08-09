import { vi } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockPatch = vi.fn();  
const mockDelete = vi.fn();

export default {
  create: () => ({
    get: mockGet,
    post: mockPost,
    put: mockPut,
    patch: mockPatch,      
    delete: mockDelete,
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  }),
  get: mockGet,
  post: mockPost,
  put: mockPut,
  patch: mockPatch,         
  delete: mockDelete,
};

export { mockGet, mockPost, mockPut, mockPatch, mockDelete };