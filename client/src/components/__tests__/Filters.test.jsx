import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Filters from '../Filters';
import productsReducer, {
  setSelectedCategory,
  setPriceFilter,
} from '../../store/productsSlice';

const createMockStore = (preloadedState) =>
  configureStore({
    reducer: { products: productsReducer },
    preloadedState: { products: preloadedState },
  });

const defaultState = {
  items: [],
  currentProduct: null,
  status: 'idle',
  error: null,
  categories: ['electronics', 'books'],
  currentPage: 1,
  itemsPerPage: 12,
  totalPages: 1,
  totalItems: 0,
  minPrice: '',
  maxPrice: '',
  selectedCategory: '',
  sort: 'default',
};

const renderFilters = (state = defaultState) => {
  const store = createMockStore(state);
  return {
    ...render(
      <Provider store={store}>
        <Filters />
      </Provider>
    ),
    store,
  };
};

describe('Filters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders category select and price inputs', () => {
    renderFilters();
    expect(screen.getByText('Категория')).toBeInTheDocument();
    expect(screen.getByText('Все категории')).toBeInTheDocument();
    expect(screen.getByText('Цена')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('10000')).toBeInTheDocument();
    expect(screen.getByText('Применить цену')).toBeInTheDocument();
    expect(screen.getByText('Сбросить фильтры')).toBeInTheDocument();
  });

  it('dispatches setSelectedCategory when category changes', () => {
    const { store } = renderFilters();
    const select = screen.getByRole('combobox'); // или getByDisplayValue, но Select рендерится как <select>
    fireEvent.change(select, { target: { value: 'electronics' } });
    const state = store.getState().products;
    expect(state.selectedCategory).toBe('electronics');
  });

  it('dispatches setPriceFilter when "Применить цену" clicked', () => {
    const { store } = renderFilters();
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '10' } });
    fireEvent.change(screen.getByPlaceholderText('10000'), { target: { value: '100' } });
    fireEvent.click(screen.getByText('Применить цену'));
    const state = store.getState().products;
    expect(state.minPrice).toBe('10');
    expect(state.maxPrice).toBe('100');
  });

  it('resets filters when "Сбросить фильтры" clicked', () => {
    const { store } = renderFilters({
      ...defaultState,
      selectedCategory: 'books',
      minPrice: '5',
      maxPrice: '50',
    });
    fireEvent.click(screen.getByText('Сбросить фильтры'));
    const state = store.getState().products;
    expect(state.selectedCategory).toBe('');
    expect(state.minPrice).toBe('');
    expect(state.maxPrice).toBe('');
  });
});