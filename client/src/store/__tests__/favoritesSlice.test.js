import favoritesReducer, { toggleFavorite, removeFromFavorites } from '../favoritesSlice';

describe('favoritesSlice', () => {
  let initialState;

  beforeEach(() => {
    initialState = { items: [] };
  });

  describe('toggleFavorite', () => {
    test('should add a product id if not already in favorites', () => {
      const state = favoritesReducer(initialState, toggleFavorite(42));
      expect(state.items).toEqual([42]);
    });

    test('should remove a product id if already in favorites', () => {
      const startState = { items: [42, 7] };
      const state = favoritesReducer(startState, toggleFavorite(42));
      expect(state.items).toEqual([7]);
    });

    test('should not duplicate when adding the same id twice (should be removed on second call)', () => {
      // start empty, add 42, then add again → should remove
      let state = favoritesReducer(initialState, toggleFavorite(42));
      expect(state.items).toEqual([42]);
      state = favoritesReducer(state, toggleFavorite(42));
      expect(state.items).toEqual([]);
    });

    test('should handle multiple items and remove the correct one', () => {
      const startState = { items: [10, 20, 30] };
      const state = favoritesReducer(startState, toggleFavorite(20));
      expect(state.items).toEqual([10, 30]);
    });
  });

  describe('removeFromFavorites', () => {
    test('should remove a specific product id', () => {
      const startState = { items: [1, 2, 3] };
      const state = favoritesReducer(startState, removeFromFavorites(2));
      expect(state.items).toEqual([1, 3]);
    });

    test('should do nothing if product id is not in the list', () => {
      const startState = { items: [1, 2, 3] };
      const state = favoritesReducer(startState, removeFromFavorites(99));
      expect(state.items).toEqual([1, 2, 3]);
    });

    test('should work when list is empty', () => {
      const state = favoritesReducer(initialState, removeFromFavorites(1));
      expect(state.items).toEqual([]);
    });
  });
});