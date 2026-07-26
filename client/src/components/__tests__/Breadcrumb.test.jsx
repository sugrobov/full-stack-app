import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Breadcrumb from '../Breadcrumb';
import productsReducer from '../../store/productsSlice';

const createMockStore = (preloadedState = {}) =>
  configureStore({
    reducer: { products: productsReducer },
    preloadedState: { products: preloadedState },
  });

const renderBreadcrumb = ({ route = '/', productName, state } = {}) => {
  const store = createMockStore(state || {
    items: [],
    currentProduct: null,
    status: 'idle',
    error: null,
    categories: [],
    currentPage: 1,
    itemsPerPage: 12,
    totalPages: 1,
    totalItems: 0,
    minPrice: '',
    maxPrice: '',
    selectedCategory: '',
    sort: 'default',
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <Breadcrumb productName={productName} />
      </MemoryRouter>
    </Provider>
  );
};

describe('Breadcrumb', () => {
  it('renders only "Главная" on home page', () => {
    renderBreadcrumb({ route: '/' });
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.queryByText('Каталог товаров')).not.toBeInTheDocument();
  });

  it('renders breadcrumb for cart page', () => {
    renderBreadcrumb({ route: '/cart' });
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByText('Корзина')).toBeInTheDocument();
    // "Корзина" is the current page, should be a span, not a link
    const cartBreadcrumb = screen.getByText('Корзина');
    expect(cartBreadcrumb.tagName).toBe('SPAN');
    expect(cartBreadcrumb).toHaveAttribute('aria-current', 'page');
  });

  it('renders breadcrumb for contact page', () => {
    renderBreadcrumb({ route: '/contact' });
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByText('Обратная связь')).toBeInTheDocument();
  });

  it('renders breadcrumb for news page', () => {
    renderBreadcrumb({ route: '/news/some-id' });
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByText('Новости')).toBeInTheDocument();
  });

  it('renders product breadcrumb with product name from prop', () => {
    renderBreadcrumb({ route: '/product/42', productName: 'Test Product' });
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByText('Каталог товаров')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders product breadcrumb with product name from Redux store', () => {
    const state = {
      items: [{ id: 42, name: 'Redux Product' }],
      // другие поля не важны
    };
    renderBreadcrumb({ route: '/product/42', state });
    expect(screen.getByText('Redux Product')).toBeInTheDocument();
  });

  it('does not render product name if not found in store and no prop', () => {
    renderBreadcrumb({ route: '/product/999', productName: undefined, state: { items: [] } });
    expect(screen.getByText('Главная')).toBeInTheDocument();
    expect(screen.getByText('Каталог товаров')).toBeInTheDocument();
    // Третьего элемента нет (кроме разделителей)
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2); // Главная и Каталог товаров
  });
});