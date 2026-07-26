import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import SortSelect from '../SortSelect';
import productsReducer from '../../store/productsSlice';

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
  categories: [],
  currentPage: 1,
  itemsPerPage: 12,
  totalPages: 1,
  totalItems: 0,
  minPrice: '',
  maxPrice: '',
  selectedCategory: '',
  sort: 'default',
};

describe('SortSelect', () => {
  it('renders with default value', () => {
    const store = createMockStore(defaultState);
    render(
      <Provider store={store}>
        <SortSelect />
      </Provider>
    );
    const select = screen.getByRole('combobox', { name: /сортировать/i });
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('default');
  });

  it('dispatches setSort on change', () => {
    const store = createMockStore(defaultState);
    render(
      <Provider store={store}>
        <SortSelect />
      </Provider>
    );
    const select = screen.getByRole('combobox', { name: /сортировать/i });
    fireEvent.change(select, { target: { value: 'price_asc' } });
    expect(store.getState().products.sort).toBe('price_asc');
  });
});