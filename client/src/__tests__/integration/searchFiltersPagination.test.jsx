import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils.jsx';
import axios from 'axios';
import ShopPage from '../../pages/ShopPage';

beforeEach(() => {
  axios.get.mockReset();
  axios.get.mockResolvedValue({ data: [] });
});

const createStoreWithProducts = (items = [], extra = {}) => ({
  products: {
    items,
    status: 'succeeded',
    totalPages: 1,
    currentPage: 1,
    filters: {},
    categories: ['Одежда', 'Книги'],
    ...extra,
  },
});

test('отображает товары из Redux store', async () => {
  const products = [
    { id: 1, name: 'Футболка', category: 'Одежда', price: 1000, image: '', stock: 10 },
    { id: 2, name: 'Джинсы', category: 'Одежда', price: 2500, image: '', stock: 5 },
  ];
  renderWithProviders(<ShopPage />, {
    preloadedState: createStoreWithProducts(products),
    initialEntries: ['/shop'],
  });
  expect(screen.getByText('Футболка')).toBeInTheDocument();
  expect(screen.getByText('Джинсы')).toBeInTheDocument();
});

test('пагинация вызывает запрос с новым номером страницы', async () => {
  const products = Array.from({ length: 15 }, (_, i) => ({ id: i + 1, name: `Товар ${i + 1}`, price: 100, image: '' }));
  renderWithProviders(<ShopPage />, {
    preloadedState: createStoreWithProducts(products.slice(0, 10), { totalPages: 2, currentPage: 1 }),
    initialEntries: ['/shop'],
  });
  const nextPageBtn = screen.getByRole('button', { name: /следующая/i });
  expect(nextPageBtn).not.toBeDisabled();
  axios.get.mockClear();
  await userEvent.click(nextPageBtn);
  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('page=2'));
  });
});

test('поиск вызывает запрос с параметром search', async () => {
  renderWithProviders(<ShopPage />, {
    preloadedState: createStoreWithProducts([]),
    initialEntries: ['/shop'],
  });
  const searchInput = screen.getByPlaceholderText('Поиск товаров...');
  await userEvent.type(searchInput, 'Футболка');
  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('search=Футболка'));
  }, { timeout: 500 });
});