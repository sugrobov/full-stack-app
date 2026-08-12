import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios'; // глобальный мок из setupTests доступен
import { renderWithProviders } from '../test-utils.jsx';
import FavoritesPage from '../../pages/FavoritesPage';

const product = {
  id: 1,
  name: 'Тестовый товар',
  price: 100,
  image: '/images/test.jpg',
  category_name: 'Категория',
};

test('отображает товары из избранного и удаляет при клике', async () => {
  // Мокаем успешный ответ axios.post('/products/by-ids')
  axios.post.mockResolvedValueOnce({ data: [product] });

  const { store } = renderWithProviders(<FavoritesPage />, {
    preloadedState: {
      favorites: { items: [product.id] }, // только массив id
      auth: { user: null, token: 'token', isLoading: false, error: null },
    },
    initialEntries: ['/favorites'],
  });

  // Дожидаемся появления товара
  await waitFor(() => {
    expect(screen.getByText('Тестовый товар')).toBeInTheDocument();
  });

  // Кнопка удаления с полным aria-label
  const removeButton = screen.getByLabelText(
    'Удалить Тестовый товар из избранного'
  );
  await userEvent.click(removeButton);

  // После клика товар должен исчезнуть, а id – удалиться из стора
  await waitFor(() => {
    expect(screen.queryByText('Тестовый товар')).not.toBeInTheDocument();
  });
  expect(store.getState().favorites.items).toHaveLength(0);
});