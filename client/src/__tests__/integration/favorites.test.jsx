import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils.jsx';
import axios from 'axios';
import ShopPage from '../../pages/ShopPage';
import FavoritesPage from '../../pages/FavoritesPage';

const product = { id: 1, name: 'Тестовый товар', price: 100, category: 'Тест', image: '' };
const makeProductResponse = (products, totalPages = 1) => ({
  data: {
    products,
    pagination: { totalPages, totalItems: products.length },
    currentPage: 1,
  },
});

beforeEach(() => {
  axios.get.mockReset();
  axios.get.mockImplementation((url) => {
    if (url.includes('/products')) {
      return Promise.resolve(makeProductResponse([product]));
    }
    if (url.includes('/categories')) {
      return Promise.resolve({ data: ['Тест'] });
    }
    return Promise.resolve({ data: {} });
  });
});

test('добавление в избранное и отображение на странице избранного', async () => {
  const { store, unmount } = renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] });
  await waitFor(() => screen.getByText('Тестовый товар'));

  await userEvent.click(screen.getByLabelText('Добавить в избранное'));
  expect(store.getState().favorites.items).toContainEqual(product);
  unmount();

  renderWithProviders(<FavoritesPage />, { store, initialEntries: ['/favorites'] });
  await waitFor(() => expect(screen.getByText('Тестовый товар')).toBeInTheDocument());

  await userEvent.click(screen.getByLabelText('Удалить из избранного'));
  expect(store.getState().favorites.items).toHaveLength(0);
  await waitFor(() => expect(screen.queryByText('Тестовый товар')).not.toBeInTheDocument());
});