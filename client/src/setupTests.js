// client/src/setupTests.js
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { axiosMock, localforageMock, framerMotionMock, recaptchaMock } from './__tests__/test-utils/mocks.jsx';

vi.mock('axios', () => axiosMock);
vi.mock('localforage', () => localforageMock);
vi.mock('framer-motion', () => framerMotionMock);
vi.mock('react-google-recaptcha', () => recaptchaMock);