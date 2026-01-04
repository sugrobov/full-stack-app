import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Функция для генерации цветного градиента
const generateGradientColor = (id, imgIndex) => {
  // Генерируем уникальный цвет на основе id и imgIndex
  const hue = (id * imgIndex) % 360;
  const saturation = 70 + (id % 30); // 70-100%
  const lightness = 50 + (imgIndex % 20); // 50-70%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Функция для создания градиента
const createGradient = (id, imgIndex) => {
  const color1 = generateGradientColor(id, imgIndex);
  const color2 = generateGradientColor(id + 1, imgIndex + 1);

  return `linear-gradient(135deg, ${color1}, ${color2})`;
};

// Mock data for products
const generateMockProducts = () => {
  const categories = Array.from({ length: 25 }, (_, i) => `Категория ${i + 1}`);
  const products = [];

  categories.forEach((category, categoryIndex) => {
    const productCount = Math.floor(Math.random() * 31) + 10; // 10-40 products per category

    for (let i = 1; i <= productCount; i++) {
      const id = categoryIndex * 100 + i;
      const hasDiscount = Math.random() > 0.7;
      const basePrice = Math.floor(Math.random() * 10000) + 1000;
      const discountPercent = Math.floor(Math.random() * 30) + 5;
      const stock = Math.floor(Math.random() * 100);
      const imageCount = Math.floor(Math.random() * 5) + 1; // 1-5 изображений

      // Генерируем массив изображений
      const images = Array.from({ length: imageCount }, (_, imgIndex) =>
        createGradient(id, imgIndex)
      );

      products.push({
        id,
        name: `Товар ${id} из ${category}`,
        category,
        price: basePrice,
        discountPrice: hasDiscount ? Math.round(basePrice * (100 - discountPercent) / 100) : null,
        rating: (Math.random() * 5).toFixed(1),
        stock,
        image: images[0], // Первое изображение для обратной совместимости
        images, // Массив всех изображений
        description: `Подробное описание товара ${id}. Этот товар относится к категории ${category} и обладает отличными характеристиками.`,
      });
    }
  });

  return products.filter(product => product.stock > 0);
};

const mockProducts = generateMockProducts();

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockProducts;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    filteredItems: [],
    status: 'idle',
    error: null,
    categories: [],
    currentPage: 1,
    itemsPerPage: 12,
    searchQuery: '',
    minPrice: '',
    maxPrice: '',
    selectedCategory: '',
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.currentPage = 1;
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
    filterProducts: (state) => {
      let filtered = state.items;

      // Apply category filter
      if (state.selectedCategory) {
        filtered = filtered.filter(product => product.category === state.selectedCategory);
      }

      // Apply search filter
      if (state.searchQuery) {
        filtered = filtered.filter(product =>
          product.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(state.searchQuery.toLowerCase())
        );
      }

      // Apply price filter
      if (state.minPrice !== '' && state.minPrice !== null) {
        filtered = filtered.filter(product =>
          product.discountPrice
            ? product.discountPrice >= parseFloat(state.minPrice)
            : product.price >= parseFloat(state.minPrice)
        );
      }

      if (state.maxPrice !== '' && state.maxPrice !== null) {
        filtered = filtered.filter(product =>
          product.discountPrice
            ? product.discountPrice <= parseFloat(state.maxPrice)
            : product.price <= parseFloat(state.maxPrice)
        );
      }

      state.filteredItems = filtered;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.filteredItems = action.payload;
        // Extract unique categories
        state.categories = [...new Set(action.payload.map(product => product.category))];
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const { setSearchQuery, setPriceFilter, setSelectedCategory, setCurrentPage, filterProducts } = productsSlice.actions;
export default productsSlice.reducer;