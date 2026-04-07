import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Helper to build query string
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
      search: state.searchQuery,
      minPrice: state.minPrice,
      maxPrice: state.maxPrice,
      category: state.selectedCategory,
    };
    const query = buildQueryString(params);
    const response = await fetch(`${import.meta.env.VITE_API_URL}/products?${query}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data; // { products, pagination }
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
    items: [],               // products for current page
    currentProduct: null,   // single product view
    status: 'idle',         // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    categories: [],
    currentPage: 1,
    itemsPerPage: 12,
    totalPages: 1,
    totalItems: 0,
    searchQuery: '',
    minPrice: '',
    maxPrice: '',
    selectedCategory: '',
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.currentPage = 1; // reset to first page
    },
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
      state.searchQuery = '';
      state.minPrice = '';
      state.maxPrice = '';
      state.selectedCategory = '';
      state.currentPage = 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
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
      // fetchCategories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload.map(cat => cat.name);
      })
      // fetchProductById
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
  setSearchQuery,
  setPriceFilter,
  setSelectedCategory,
  setCurrentPage,
  clearFilters,
} = productsSlice.actions;

export default productsSlice.reducer;