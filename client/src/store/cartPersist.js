import { saveCartState, loadCartState } from "../utils/cartStorage";
import { loadSavedCart } from "./cartSlice";

// state для отслеживания изменений
let prevCartState = null;

export const initCartPersist = (store) => {
  // 1. Загружаем сохраненную корзину при старте
  loadCartState().then(savedCart => {
    if (savedCart) {
      store.dispatch(loadSavedCart(savedCart));
    }
  });

}