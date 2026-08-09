import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockAxios } from '../test-utils.jsx';
import ShopPage from '../../pages/ShopPage';

const baseProducts = [
  { id: 1, name: 'Футболка', category: 'Одежда', price: 1000, image: '' },
  { id: 2, name: 'Джинсы', category: 'Одежда', price: 2500, image: '' },
  { id: 3, name: 'Книга', category: 'Книги', price: 500, image: '' },
];

test('фильтрация по категории обновляет список товаров', async () => {
  // Первый раунд: категории, потом продукты
  mockAxios.get.mockResolvedValueOnce({ data: ['Одежда', 'Книги'] });
  mockAxios.get.mockResolvedValueOnce({ data: { products: baseProducts, totalPages: 2, currentPage: 1 } });

  renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] });

  await waitFor(() => {
    expect(screen.getByText('Футболка')).toBeInTheDocument();
  });

  // Запросы после выбора категории
  mockAxios.get.mockResolvedValueOnce({ data: ['Одежда', 'Книги'] });
  mockAxios.get.mockResolvedValueOnce({ data: { products: [baseProducts[2]], totalPages: 1, currentPage: 1 } });

  const categorySelect = screen.getByLabelText('Категория');
  await userEvent.selectOptions(categorySelect, 'Книги');

  await waitFor(() => {
    expect(screen.getByText('Книга')).toBeInTheDocument();
    expect(screen.queryByText('Футболка')).not.toBeInTheDocument();
  });
});

test('поиск по названию с debounce', async () => {
  mockAxios.get.mockResolvedValueOnce({ data: ['Одежда', 'Книги'] });
  mockAxios.get.mockResolvedValueOnce({ data: { products: baseProducts, totalPages: 2, currentPage: 1 } });

  renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] });

  await waitFor(() => {
    expect(screen.getByText('Футболка')).toBeInTheDocument();
  });

  mockAxios.get.mockResolvedValueOnce({ data: ['Одежда', 'Книги'] });
  mockAxios.get.mockResolvedValueOnce({ data: { products: [baseProducts[1]], totalPages: 1, currentPage: 1 } });

  const searchInput = screen.getByPlaceholderText('Поиск товаров...');
  await userEvent.type(searchInput, 'Джинсы');

  await waitFor(() => {
    expect(screen.getByText('Джинсы')).toBeInTheDocument();
    expect(screen.queryByText('Футболка')).not.toBeInTheDocument();
  }, { timeout: 500 });
});