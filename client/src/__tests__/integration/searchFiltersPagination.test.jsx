import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockAxios } from '../test-utils.jsx';
import ShopPage from '../../pages/ShopPage';

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
  mockAxios.get.mockReset();
  // Порядок запросов: категории, потом продукты
  mockAxios.get.mockResolvedValueOnce({ data: ['Одежда', 'Книги'] });
  mockAxios.get.mockResolvedValueOnce(makeProductResponse(baseProducts));
});

test('фильтрация по категории обновляет список товаров', async () => {
  renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] });

  await waitFor(() => {
    expect(screen.getByText('Футболка')).toBeInTheDocument();
  });

  // Новый набор запросов: категории + фильтрованные продукты
  mockAxios.get.mockResolvedValueOnce({ data: ['Одежда', 'Книги'] });
  mockAxios.get.mockResolvedValueOnce(makeProductResponse([baseProducts[2]], 1));

  const categorySelect = screen.getByLabelText('Категория');
  await userEvent.selectOptions(categorySelect, 'Книги');

  await waitFor(() => {
    expect(screen.getByText('Книга')).toBeInTheDocument();
    expect(screen.queryByText('Футболка')).not.toBeInTheDocument();
  });
});

test('поиск по названию с debounce', async () => {
  renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] });

  await waitFor(() => {
    expect(screen.getByText('Футболка')).toBeInTheDocument();
  });

  mockAxios.get.mockResolvedValueOnce({ data: ['Одежда', 'Книги'] });
  mockAxios.get.mockResolvedValueOnce(makeProductResponse([baseProducts[1]], 1));

  const searchInput = screen.getByPlaceholderText('Поиск товаров...');
  await userEvent.type(searchInput, 'Джинсы');

  await waitFor(() => {
    expect(screen.getByText('Джинсы')).toBeInTheDocument();
    expect(screen.queryByText('Футболка')).not.toBeInTheDocument();
  }, { timeout: 500 });
});