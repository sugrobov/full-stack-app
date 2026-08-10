import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils.jsx';
import axios from 'axios';
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
  axios.get.mockReset();
  // ВРЕМЕННО: даём фиксированный ответ, чтобы проверить рендер
  axios.get.mockResolvedValue({
    data: {
      products: baseProducts,
      pagination: { totalPages: 2, totalItems: 3 },
      currentPage: 1,
    },
  });
});

test('фильтрация по категории обновляет список товаров', async () => {
  renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] });

  // Ждём появления товаров
  await waitFor(() => expect(screen.getByText('Футболка')).toBeInTheDocument());

  // Теперь имитируем клик по категории – компонент должен сделать новый запрос
  axios.get.mockImplementation((url) => {
    if (url.includes('category=Книги')) {
      return Promise.resolve(makeProductResponse([baseProducts[2]], 1));
    }
    // Для остальных запросов возвращаем изначальные продукты
    return Promise.resolve(makeProductResponse(baseProducts));
  });

  const categorySelect = screen.getByLabelText('Категория');
  await userEvent.selectOptions(categorySelect, 'Книги');

  await waitFor(() => {
    expect(screen.getByText('Книга')).toBeInTheDocument();
    expect(screen.queryByText('Футболка')).not.toBeInTheDocument();
  });
});

test('поиск по названию с debounce', async () => {
  renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] });
  await waitFor(() => expect(screen.getByText('Футболка')).toBeInTheDocument());

  axios.get.mockImplementation((url) => {
    if (url.includes('search=Джинсы')) {
      return Promise.resolve(makeProductResponse([baseProducts[1]], 1));
    }
    return Promise.resolve(makeProductResponse(baseProducts));
  });

  const searchInput = screen.getByPlaceholderText('Поиск товаров...');
  await userEvent.type(searchInput, 'Джинсы');

  await waitFor(() => {
    expect(screen.getByText('Джинсы')).toBeInTheDocument();
    expect(screen.queryByText('Футболка')).not.toBeInTheDocument();
  }, { timeout: 500 });
});