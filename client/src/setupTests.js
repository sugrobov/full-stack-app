import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Активируем наш ручной мок axios (файл __mocks__/axios.js)
vi.mock('axios');