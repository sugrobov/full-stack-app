import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils.jsx';
import axios from 'axios';
import ShopPage from '../../pages/ShopPage';
import FavoritesPage from '../../pages/FavoritesPage';

const product = { id: 1, name: 'Тестовый товар', price: 100, category: 'Тест', image: '' };

beforeEach(() => {
  axios.get.mockReset();
  // ВРЕМЕННО: фиксированный ответ для любого запроса
  axios.get.mockResolvedValue({
    data: {
      products: [product],
      pagination: { totalPages: 1, totalItems: 1 },
      currentPage: 1,
    },
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