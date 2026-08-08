import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockAxios } from '../test-utils.jsx';
import ShopPage from '../../pages/ShopPage';

const baseProducts = [
  { id: 1, name: 'Футболка', category: 'Одежда', price: 1000, image: '' },
  { id: 2, name: 'Джинсы', category: 'Одежда', price: 2500, image: '' },
  { id: 3, name: 'Книга', category: 'Книги', price: 500, image: '' },
];

// Универсальный мок, возвращающий продукты для /products, иначе пустой успех
const setProductMock = (products, totalPages = 2, currentPage = 1) => {
  mockAxios.get.mockImplementation((url) => {
    if (url.includes('/products')) {
      return Promise.resolve({ data: { products, totalPages, currentPage } });
    }
    return Promise.resolve({ data: {} });
  });
};

test('фильтрация по категории обновляет список товаров', async () => {
  setProductMock(baseProducts);
  renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] });

  await waitFor(() => screen.getByText('Футболка'));

  // Меняем мок для фильтрации
  mockAxios.get.mockImplementation((url) => {
    if (url.includes('category=Книги')) {
      return Promise.resolve({ data: { products: [baseProducts[2]], totalPages: 1, currentPage: 1 } });
    }
    if (url.includes('/products')) {
      return Promise.resolve({ data: { products: baseProducts, totalPages: 2, currentPage: 1 } });
    }
    return Promise.resolve({ data: {} });
  });

  const categorySelect = screen.getByLabelText('Категория');
  await userEvent.selectOptions(categorySelect, 'Книги');

  await waitFor(() => {
    expect(screen.getByText('Книга')).toBeInTheDocument();
    expect(screen.queryByText('Футболка')).not.toBeInTheDocument();
  });
});

test('поиск по названию с debounce', async () => {
  setProductMock(baseProducts);
  renderWithProviders(<ShopPage />, { initialEntries: ['/shop'] });

  await waitFor(() => screen.getByText('Футболка'));

  mockAxios.get.mockImplementation((url) => {
    if (url.includes('search=Джинсы')) {
      return Promise.resolve({ data: { products: [baseProducts[1]], totalPages: 1, currentPage: 1 } });
    }
    if (url.includes('/products')) {
      return Promise.resolve({ data: { products: baseProducts, totalPages: 2, currentPage: 1 } });
    }
    return Promise.resolve({ data: {} });
  });

  const searchInput = screen.getByPlaceholderText('Поиск товаров...');
  await userEvent.type(searchInput, 'Джинсы');

  await waitFor(() => {
    expect(screen.getByText('Джинсы')).toBeInTheDocument();
    expect(screen.queryByText('Футболка')).not.toBeInTheDocument();
  }, { timeout: 500 });
});