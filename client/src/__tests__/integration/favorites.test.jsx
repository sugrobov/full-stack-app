import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithProviders } from '../test-utils.jsx';
import FavoritesPage from '../../pages/FavoritesPage';

// Мокаем fetchFavorites через hoisted, чтобы избежать ошибок инициализации
const { mockFetchFavorites } = vi.hoisted(() => ({
  mockFetchFavorites: vi.fn(() => ({ type: 'favorites/fetchFulfilled', payload: [] })),
}));

vi.mock('../../store/favoritesSlice', async () => {
  const actual = await vi.importActual('../../store/favoritesSlice');
  return {
    ...actual,
    fetchFavorites: mockFetchFavorites,
  };
});

const product = { id: 1, name: 'Тестовый товар', price: 100, image: '' };

test('отображает товары из избранного и удаляет при клике', async () => {
  const { store } = renderWithProviders(<FavoritesPage />, {
    preloadedState: {
      favorites: { items: [product], status: 'succeeded', error: null },
      products: { items: [], status: 'idle' },
    },
    initialEntries: ['/favorites'],
  });

  expect(screen.getByText('Тестовый товар')).toBeInTheDocument();

  const removeButton = screen.getByLabelText('Удалить из избранного');
  await userEvent.click(removeButton);

  expect(store.getState().favorites.items).toHaveLength(0);
  expect(screen.queryByText('Тестовый товар')).not.toBeInTheDocument();
});