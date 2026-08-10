// client/src/__tests__/test-utils/mocks.js
import { vi } from 'vitest';
import React from 'react';

// Моки для axios
export const { mockGet, mockPost, mockPut, mockPatch, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
}));

export const axiosMock = {
  default: {
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
  },
};

// Мок для localforage
export const localforageMock = {
  default: {
    createInstance: vi.fn(() => ({
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })),
  },
};

// Мок для framer-motion (убирает анимации)
export const framerMotionMock = {
  motion: {
    div: ({ children, ...props }) => React.createElement('div', props, children),
    span: ({ children, ...props }) => React.createElement('span', props, children),
  },
  AnimatePresence: ({ children }) => children,
};

// Мок для Google reCAPTCHA
export const recaptchaMock = {
  default: (props) => <div data-testid="recaptcha-mock" {...props} />,
};