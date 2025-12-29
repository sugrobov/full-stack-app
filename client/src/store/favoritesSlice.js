import { createSlice } from '@reduxjs/toolkit';

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: {
    items: [],
  },
  reducers: {
    toggleFavorite: (state, action) => {
      const productId = action.payload;
      const existingIndex = state.items.findIndex(item => item === productId);
      
      if (existingIndex >= 0) {
        // Remove from favorites
        state.items.splice(existingIndex, 1);
      } else {
        // Add to favorites
        state.items.push(productId);
      }
    },
    removeFromFavorites: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(item => item !== productId);
    },
  },
});

export const { toggleFavorite, removeFromFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;