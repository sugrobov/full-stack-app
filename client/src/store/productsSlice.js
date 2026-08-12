import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const buildQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (_, { getState }) => {
    const state = getState().products;
    const params = {
      page: state.currentPage,
      limit: state.itemsPerPage,
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
      category: state.selectedCategory,
      sort: state.sort,
    };
    const query = buildQueryString(params);
    const response = await fetch(`${import.meta.env.VITE_API_URL}/products?${query}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data;
  }
);

export const fetchCategories = createAsyncThunk(
  'products/fetchCategories',
  async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return data;
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    const data = await response.json();
    return data;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
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
  },
  reducers: {
    setPriceFilter: (state, action) => {
      state.minPrice = action.payload.minPrice;
      state.maxPrice = action.payload.maxPrice;
      state.currentPage = 1;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
      state.currentPage = 1;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    clearFilters: (state) => {
      state.minPrice = '';
      state.maxPrice = '';
      state.selectedCategory = '';
      state.currentPage = 1;
    },
    setFiltersFromURL: (state, action) => {
      const { category, minPrice, maxPrice, page } = action.payload;
      if (category !== undefined && category !== null) state.selectedCategory = category;
      if (minPrice !== undefined && minPrice !== null) state.minPrice = minPrice;
      if (maxPrice !== undefined && maxPrice !== null) state.maxPrice = maxPrice;
      if (page !== undefined && page !== null) state.currentPage = parseInt(page) || 1;
      if (action.payload.sort !== undefined && action.payload.sort !== null) {
        state.sort = action.payload.sort;
      }
    },
    setSort: (state, action) => {
      state.sort = action.payload;
      state.currentPage = 1; // сброс страницы при изменении сортировки
    },
    resetAllFilters: (state) => {
      state.selectedCategory = '';
      state.minPrice = '';
      state.maxPrice = '';
      state.sort = 'default';
      state.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.products;
        state.totalPages = action.payload.pagination.totalPages;
        state.totalItems = action.payload.pagination.totalItems;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.map(cat => cat.name);
      })
      .addCase(fetchProductById.pending, (state) => {
        state.status = 'loading';
        state.currentProduct = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const {
  setPriceFilter,
  setSelectedCategory,
  setCurrentPage,
  clearFilters,
  setFiltersFromURL,
  setSort,
  resetAllFilters,
} = productsSlice.actions;

export default productsSlice.reducer;