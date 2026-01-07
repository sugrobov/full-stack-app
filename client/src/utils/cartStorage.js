import localforage from 'localforage';

// Configure localForage
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'shoppingCart',
  version: 1.0,
  storeName: 'cartStore',
  description: 'Storage for shopping cart data'
});

const CART_KEY = 'cartState';

/**
 * Save cart state to storage
 * @param {Object} cartState - The cart state to save
 * @returns {Promise<void>}
 */
export const saveCartState = async (cartState) => {
  try {
    await localforage.setItem(CART_KEY, cartState);
  } catch (error) {
    console.error('Ошибка сохранения корзины:', error);
  }
};

/**
 * Load cart state from storage
 * @returns {Promise<Object|null>} The saved cart state or null if not found
 */
export const loadCartState = async () => {
  try {
    const cartState = await localforage.getItem(CART_KEY);
    return cartState || null;
  } catch (error) {
    console.error('Ошибка загрузки корзины:', error);
    return null;
  }
};

/**
 * Clear cart state from storage
 * @returns {Promise<void>}
 */
export const clearCartStorage = async () => {
  try {
    await localforage.removeItem(CART_KEY);
  } catch (error) {
    console.error('Ошибка очистки хранилища корзины:', error);
  }
};