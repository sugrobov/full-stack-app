import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import localforage from 'localforage';
import productsReducer from './productsSlice';
import cartReducer from './cartSlice';
import favoritesReducer from './favoritesSlice';

// Конфигурация localForage для Redux Persist
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'shoppingCart',
  version: 1.0,
  storeName: 'reduxPersistStore',
  description: 'Redux persist store'
});

// Создаем storage engine для Redux Persist на основе localForage
const localForageStorage = {
  getItem: (key) => {
    return localforage.getItem(key);
  },
  setItem: (key, value) => {
    return localforage.setItem(key, value);
  },
  removeItem: (key) => {
    return localforage.removeItem(key);
  },
};

// Конфигурация для корзины
const cartPersistConfig = {
  key: 'cart',
  storage: localForageStorage,
  whitelist: ['items', 'totalQuantity', 'totalAmount']
};

// Конфигурация для избранного
const favoritesPersistConfig = {
  key: 'favorites',
  storage: localForageStorage,
  whitelist: ['items']
};

const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);
const persistedFavoritesReducer = persistReducer(favoritesPersistConfig, favoritesReducer);

const store = configureStore({
  reducer: {
    products: productsReducer,
    cart: persistedCartReducer,
    favorites: persistedFavoritesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
export default store;