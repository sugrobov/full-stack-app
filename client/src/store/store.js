import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import localforage from 'localforage';
import productsReducer from './productsSlice';
import cartReducer from './cartSlice';
import favoritesReducer from './favoritesSlice';
import authReducer from './authSlice';

// Конфигурация localForage для Redux Persist
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'shoppingCart',
  version: 1.0,
  storeName: 'reduxPersistStore',
  description: 'Redux persist store'
});

const localForageStorage = {
  getItem: (key) => localforage.getItem(key),
  setItem: (key, value) => localforage.setItem(key, value),
  removeItem: (key) => localforage.removeItem(key),
};

const cartPersistConfig = {
  key: 'cart',
  storage: localForageStorage,
  whitelist: ['items', 'totalQuantity', 'totalAmount']
};

const favoritesPersistConfig = {
  key: 'favorites',
  storage: localForageStorage,
  whitelist: ['items']
};

const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer);
const persistedFavoritesReducer = persistReducer(favoritesPersistConfig, favoritesReducer);

const authPersistConfig = {
  key: 'auth',
  storage: localForageStorage,
  whitelist: ['user', 'token']
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

const store = configureStore({
  reducer: {
    products: productsReducer,   // no persist for products
    cart: persistedCartReducer,
    favorites: persistedFavoritesReducer,
    auth: persistedAuthReducer,
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