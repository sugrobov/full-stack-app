import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import productsReducer, {
  setPriceFilter,
  setSelectedCategory,
  setCurrentPage,
  clearFilters,
  setFiltersFromURL,
  setSort,
  resetAllFilters,
  fetchProducts,
  fetchCategories,
  fetchProductById,
} from '../productsSlice';
import { configureStore } from '@reduxjs/toolkit';

// Вспомогательная функция buildQueryString импортируется из слайса, но она не экспортирована.
// Чтобы протестировать её косвенно, мы проверим URL в fetch. 
// Но для прямого теста можно продублировать или протестировать через fetchProducts.

// Мокируем глобальный fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Вспомогательная функция для создания store с productsReducer
const createTestStore = (preloadedState) =>
  configureStore({
    reducer: { products: productsReducer },
    preloadedState: preloadedState ? { products: preloadedState } : undefined,
  });

describe('productsSlice', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
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
    vi.clearAllMocks();
  });

  // ---------- синхронные редьюсеры ----------
  describe('reducers', () => {
    it('setPriceFilter should update minPrice, maxPrice and reset currentPage to 1', () => {
      const state = productsReducer(
        { ...initialState, currentPage: 3 },
        setPriceFilter({ minPrice: 10, maxPrice: 100 })
      );
      expect(state.minPrice).toBe(10);
      expect(state.maxPrice).toBe(100);
      expect(state.currentPage).toBe(1);
    });

    it('setSelectedCategory should set category and reset currentPage', () => {
      const state = productsReducer(
        { ...initialState, currentPage: 5 },
        setSelectedCategory('electronics')
      );
      expect(state.selectedCategory).toBe('electronics');
      expect(state.currentPage).toBe(1);
    });

    it('setCurrentPage should update currentPage', () => {
      const state = productsReducer(initialState, setCurrentPage(3));
      expect(state.currentPage).toBe(3);
    });

    it('clearFilters should reset price, category and page', () => {
      const dirty = {
        ...initialState,
        minPrice: '10',
        maxPrice: '100',
        selectedCategory: 'books',
        currentPage: 2,
      };
      const state = productsReducer(dirty, clearFilters());
      expect(state.minPrice).toBe('');
      expect(state.maxPrice).toBe('');
      expect(state.selectedCategory).toBe('');
      expect(state.currentPage).toBe(1);
    });

    it('setFiltersFromURL should update multiple filters from object, parse page as int, and handle missing values', () => {
      const state = productsReducer(
        initialState,
        setFiltersFromURL({
          category: 'toys',
          minPrice: '5',
          maxPrice: '50',
          page: '3',
          sort: 'price_asc',
        })
      );
      expect(state.selectedCategory).toBe('toys');
      expect(state.minPrice).toBe('5');
      expect(state.maxPrice).toBe('50');
      expect(state.currentPage).toBe(3);
      expect(state.sort).toBe('price_asc');
    });

    it('setFiltersFromURL should ignore undefined or null values', () => {
      const start = { ...initialState, minPrice: '10', sort: 'name_asc' };
      const state = productsReducer(
        start,
        setFiltersFromURL({ category: undefined, minPrice: null, page: undefined, sort: null })
      );
      expect(state.selectedCategory).toBe(''); // не изменилось
      expect(state.minPrice).toBe('10'); // осталось прежним
      expect(state.currentPage).toBe(1);
      expect(state.sort).toBe('name_asc'); // null не перезаписал
    });

    it('setSort should update sort and reset currentPage', () => {
      const state = productsReducer(
        { ...initialState, currentPage: 4, sort: 'default' },
        setSort('price_desc')
      );
      expect(state.sort).toBe('price_desc');
      expect(state.currentPage).toBe(1);
    });

    it('resetAllFilters should return to default filters (including sort)', () => {
      const dirty = {
        ...initialState,
        selectedCategory: 'music',
        minPrice: 1,
        maxPrice: 999,
        sort: 'rating',
        currentPage: 10,
      };
      const state = productsReducer(dirty, resetAllFilters());
      expect(state.selectedCategory).toBe('');
      expect(state.minPrice).toBe('');
      expect(state.maxPrice).toBe('');
      expect(state.sort).toBe('default');
      expect(state.currentPage).toBe(1);
    });
  });

  // ---------- асинхронные thunk'и ----------
  describe('fetchProducts thunk', () => {
    it('should handle pending state', () => {
      const store = createTestStore(initialState);
      store.dispatch(fetchProducts.pending());
      expect(store.getState().products.status).toBe('loading');
      expect(store.getState().products.error).toBeNull();
    });

    it('should handle fulfilled state and update items/pagination', () => {
      const store = createTestStore(initialState);
      const payload = {
        products: [{ id: 1, name: 'A' }],
        pagination: { totalPages: 5, totalItems: 50 },
      };
      store.dispatch(fetchProducts.fulfilled(payload));
      const state = store.getState().products;
      expect(state.status).toBe('succeeded');
      expect(state.items).toEqual(payload.products);
      expect(state.totalPages).toBe(5);
      expect(state.totalItems).toBe(50);
    });

    it('should handle rejected state', () => {
      const store = createTestStore(initialState);
      const error = new Error('Network error');
      store.dispatch(fetchProducts.rejected(error));
      expect(store.getState().products.status).toBe('failed');
      expect(store.getState().products.error).toBe('Network error');
    });

    it('should call fetch with correct URL built from state', async () => {
      const preloadedState = {
        ...initialState,
        currentPage: 2,
        itemsPerPage: 12,
        minPrice: 5,
        maxPrice: 50,
        selectedCategory: 'books',
        sort: 'price_asc',
      };
      const store = createTestStore(preloadedState);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          products: [],
          pagination: { totalPages: 1, totalItems: 0 },
        }),
      });

      await store.dispatch(fetchProducts());
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0];
      // Проверяем, что URL содержит все параметры
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('limit=12');
      expect(calledUrl).toContain('minPrice=5');
      expect(calledUrl).toContain('maxPrice=50');
      expect(calledUrl).toContain('category=books');
      expect(calledUrl).toContain('sort=price_asc');
    });
  });

  describe('fetchCategories thunk', () => {
    it('should set categories on fulfilled (mapping name)', () => {
      const store = createTestStore(initialState);
      const payload = [
        { id: 1, name: 'electronics' },
        { id: 2, name: 'books' },
      ];
      store.dispatch(fetchCategories.fulfilled(payload));
      expect(store.getState().products.categories).toEqual(['electronics', 'books']);
    });

    it('should handle empty array', () => {
      const store = createTestStore(initialState);
      store.dispatch(fetchCategories.fulfilled([]));
      expect(store.getState().products.categories).toEqual([]);
    });
  });

  describe('fetchProductById thunk', () => {
    it('should set loading and clear currentProduct on pending', () => {
      const store = createTestStore({ ...initialState, currentProduct: { id: 2 } });
      store.dispatch(fetchProductById.pending());
      expect(store.getState().products.status).toBe('loading');
      expect(store.getState().products.currentProduct).toBeNull();
    });

    it('should set product on fulfilled', () => {
      const store = createTestStore(initialState);
      const product = { id: 3, name: 'Phone' };
      store.dispatch(fetchProductById.fulfilled(product));
      expect(store.getState().products.status).toBe('succeeded');
      expect(store.getState().products.currentProduct).toEqual(product);
    });

    it('should set error on rejected', () => {
      const store = createTestStore(initialState);
      const error = new Error('Not found');
      store.dispatch(fetchProductById.rejected(error));
      expect(store.getState().products.status).toBe('failed');
      expect(store.getState().products.error).toBe('Not found');
    });

    it('should call fetch with correct product ID', async () => {
      const store = createTestStore(initialState);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 42, name: 'Test' }),
      });
      await store.dispatch(fetchProductById(42));
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/42'));
    });
  });
});