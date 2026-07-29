import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import productsReducer, { fetchProducts } from '../../store/productsSlice';
import favoritesReducer from '../../store/favoritesSlice';
import ShopPage from '../../pages/ShopPage';

window.scrollTo = vi.fn();

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>),
  },
}));

const mockProductsPage1 = [
  { id: 1, name: 'Alpha', category_id: 1, category_name: 'Category A', price: 100, discount_price: null, stock: 10, rating: 4, images: [] },
  { id: 2, name: 'Beta', category_id: 2, category_name: 'Category B', price: 200, discount_price: 150, stock: 5, rating: 3, images: [] },
];

const mockProductsPage2 = [
  { id: 3, name: 'Gamma', category_id: 1, category_name: 'Category A', price: 300, discount_price: null, stock: 8, rating: 5, images: [] },
];

vi.mock('../../store/productsSlice', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchProducts: () => (dispatch) => {
      dispatch({
        type: 'products/fetchProducts/fulfilled',
        payload: {
          products: mockProductsPage1,
          pagination: { page: 1, limit: 12, totalPages: 2, totalItems: 3 },
        },
      });
    },
    fetchCategories: () => (dispatch) => {
      dispatch({
        type: 'products/fetchCategories/fulfilled',
        payload: [],
      });
    },
  };
});

const createTestStore = () =>
  configureStore({
    reducer: {
      products: productsReducer,
      favorites: favoritesReducer,
    },
    preloadedState: {
      favorites: { items: [] },
    },
  });

const renderShopPage = () => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/shop']}>
        <ShopPage />
      </MemoryRouter>
    </Provider>
  );
};

const getCategorySelect = () => {
  const label = screen.getByText('Категория');
  return label.parentElement.querySelector('select');
};

describe('Search → Filters → Pagination integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('full flow: initial load, filter by category & price, reset, paginate', async () => {
    renderShopPage();

    // 1. Дождаться загрузки товаров
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Beta' })).toBeInTheDocument();
    });

    // 2. Фильтр по категории (Category A, id=1)
    vi.mocked(fetchProducts).mockImplementation(() => (dispatch) => {
      dispatch({
        type: 'products/fetchProducts/fulfilled',
        payload: {
          products: [mockProductsPage1[0]],
          pagination: { page: 1, limit: 12, totalPages: 1, totalItems: 1 },
        },
      });
    });

    fireEvent.change(getCategorySelect(), { target: { value: '1' } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Beta' })).not.toBeInTheDocument();
    });

    // 3. Фильтр по цене – показываем Gamma
    vi.mocked(fetchProducts).mockImplementation(() => (dispatch) => {
      dispatch({
        type: 'products/fetchProducts/fulfilled',
        payload: {
          products: [mockProductsPage2[0]],
          pagination: { page: 1, limit: 12, totalPages: 1, totalItems: 1 },
        },
      });
    });

    const priceInputs = screen.getAllByPlaceholderText('0');
    fireEvent.change(priceInputs[0], { target: { value: '250' } });
    fireEvent.change(priceInputs[1], { target: { value: '350' } });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Gamma' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Alpha' })).not.toBeInTheDocument();
    });

    // 4. Сброс фильтров – возвращаем исходные товары
    vi.mocked(fetchProducts).mockImplementation(() => (dispatch) => {
      dispatch({
        type: 'products/fetchProducts/fulfilled',
        payload: {
          products: mockProductsPage1,
          pagination: { page: 1, limit: 12, totalPages: 2, totalItems: 3 },
        },
      });
    });

    const resetButton = screen.getByText('Сбросить всё');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Alpha' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Beta' })).toBeInTheDocument();
    });

    // 5. Пагинация: переход на вторую страницу
    vi.mocked(fetchProducts).mockImplementation(() => (dispatch) => {
      dispatch({
        type: 'products/fetchProducts/fulfilled',
        payload: {
          products: mockProductsPage2,
          pagination: { page: 2, limit: 12, totalPages: 2, totalItems: 3 },
        },
      });
    });

    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Gamma' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Alpha' })).not.toBeInTheDocument();
    });
  });
});