import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils.jsx';
import ShopPage from '../../pages/ShopPage';

test('отображает товары из Redux store', () => {
  const products = [
    { id: 1, name: 'Футболка', category: 'Одежда', price: 1000, image: '', stock: 10 },
    { id: 2, name: 'Джинсы', category: 'Одежда', price: 2500, image: '', stock: 5 },
  ];
  renderWithProviders(<ShopPage />, {
    preloadedState: {
      products: {
        items: products,
        status: 'succeeded',
        totalPages: 1,
        currentPage: 1,
        filters: {},
        categories: ['Одежда', 'Книги'],
      },
    },
    initialEntries: ['/shop'],
  });
  // Проверяем, что оба товара отобразились (игнорируя заглушку-картинку)
  const items = screen.getAllByText(/Футболка|Джинсы/);
  expect(items.length).toBeGreaterThanOrEqual(2);
});