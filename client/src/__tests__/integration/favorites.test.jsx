import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockAxios } from '../test-utils.jsx';
import ShopPage from '../../pages/ShopPage';
import FavoritesPage from '../../pages/FavoritesPage';

const product = { id: 1, name: 'Тестовый товар', price: 100, category: 'Тест', image: '' };

test('добавление в избранное и отображение на странице избранного', async () => {
  // Мок возвращает продукт для /products, иначе пустой успех
  mockAxios.get.mockImplementation((url) => {
    if (url.includes('/products')) {
      return Promise.resolve({ data: { products: [product], totalPages: 1, currentPage: 1 } });
    }
    return Promise.resolve({ data: {} });
  });

  const { store, unmount } = renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] });

  await waitFor(() => screen.getByText('Тестовый товар'));
  const favButton = screen.getByLabelText('Добавить в избранное');
  await userEvent.click(favButton);
  expect(store.getState().favorites.items).toContainEqual(product);
  unmount();

  renderWithProviders(<FavoritesPage />, { store, initialEntries: ['/favorites'] });

  await waitFor(() => {
    expect(screen.getByText('Тестовый товар')).toBeInTheDocument();
  });

  const removeButton = screen.getByLabelText('Удалить из избранного');
  await userEvent.click(removeButton);
  expect(store.getState().favorites.items).toHaveLength(0);
  await waitFor(() => {
    expect(screen.queryByText('Тестовый товар')).not.toBeInTheDocument();
  });
});