import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithProviders } from '../test-utils.jsx';
import ShopPage from '../../pages/ShopPage';

// hoisted переменные для фабрики vi.mock
const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock('../../utils/axiosConfig', () => ({
  default: {
    get: mockGet,
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const baseProducts = [
  { id: 1, name: 'Футболка', category: 'Одежда', price: 1000, image: '' },
  { id: 2, name: 'Джинсы', category: 'Одежда', price: 2500, image: '' },
  { id: 3, name: 'Книга', category: 'Книги', price: 500, image: '' },
];

const makeProductResponse = (products, totalPages = 2, currentPage = 1) => ({
  data: {
    products,
    pagination: { totalPages, totalItems: products.length },
    currentPage,
  },
});

beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockImplementation((url) => {
    if (url.includes('/products')) {
      return Promise.resolve(makeProductResponse(baseProducts));
    }
    if (url.includes('/categories')) {
      return Promise.resolve({ data: ['Одежда', 'Книги'] });
    }
    return Promise.resolve({ data: {} });
  });
});

test('фильтрация по категории обновляет список товаров', async () => {
  renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] });
  await waitFor(() => expect(screen.getByText('Футболка')).toBeInTheDocument());

  mockGet.mockImplementation((url) => {
    if (url.includes('category=Книги')) {
      return Promise.resolve(makeProductResponse([baseProducts[2]], 1));
    }
    if (url.includes('/products')) {
      return Promise.resolve(makeProductResponse(baseProducts));
    }
    if (url.includes('/categories')) {
      return Promise.resolve({ data: ['Одежда', 'Книги'] });
    }
    return Promise.resolve({ data: {} });
  });

  await userEvent.selectOptions(screen.getByLabelText('Категория'), 'Книги');
  await waitFor(() => {
    expect(screen.getByText('Книга')).toBeInTheDocument();
    expect(screen.queryByText('Футболка')).not.toBeInTheDocument();
  });
});

test('поиск по названию с debounce', async () => {
  renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] });
  await waitFor(() => expect(screen.getByText('Футболка')).toBeInTheDocument());

  mockGet.mockImplementation((url) => {
    if (url.includes('search=Джинсы')) {
      return Promise.resolve(makeProductResponse([baseProducts[1]], 1));
    }
    if (url.includes('/products')) {
      return Promise.resolve(makeProductResponse(baseProducts));
    }
    if (url.includes('/categories')) {
      return Promise.resolve({ data: ['Одежда', 'Книги'] });
    }
    return Promise.resolve({ data: {} });
  });

  await userEvent.type(screen.getByPlaceholderText('Поиск товаров...'), 'Джинсы');
  await waitFor(() => {
    expect(screen.getByText('Джинсы')).toBeInTheDocument();
    expect(screen.queryByText('Футболка')).not.toBeInTheDocument();
  }, { timeout: 500 });
});