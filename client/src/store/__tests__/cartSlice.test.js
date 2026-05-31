import cartReducer, {
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
} from '../cartSlice';

describe('cartSlice', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      items: [],
      totalQuantity: 0,
      totalAmount: 0,
    };
  });

  // ---------- addToCart ----------
  describe('addToCart', () => {
    const newItem = {
      id: 1,
      name: 'Test Product',
      price: 100,
      discountPrice: 80,
      images: ['img1.jpg', 'img2.jpg'],
    };

    test('should add a new product to the cart', () => {
      const state = cartReducer(initialState, addToCart(newItem));
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toMatchObject({
        id: 1,
        name: 'Test Product',
        price: 100,
        discountPrice: 80,
        quantity: 1,
        totalPrice: 80, // discountPrice applies
        image: 'img1.jpg', // first image from array
        images: ['img1.jpg', 'img2.jpg'],
      });
      expect(state.totalQuantity).toBe(1);
      expect(state.totalAmount).toBe(80);
    });

    test('should use price when discountPrice is not provided', () => {
      const itemNoDiscount = { id: 2, name: 'No Discount', price: 200 };
      const state = cartReducer(initialState, addToCart(itemNoDiscount));
      expect(state.items[0].totalPrice).toBe(200);
      expect(state.items[0].discountPrice).toBeUndefined();
    });

    test('should handle missing images array (uses image field)', () => {
      const itemSingleImage = { id: 3, name: 'Single Image', price: 50, image: 'only.jpg' };
      const state = cartReducer(initialState, addToCart(itemSingleImage));
      expect(state.items[0].image).toBe('only.jpg');
      expect(state.items[0].images).toEqual(['only.jpg']);
    });

    test('should handle empty images array', () => {
      const itemEmptyImages = { id: 4, name: 'No images', price: 30, images: [] };
      const state = cartReducer(initialState, addToCart(itemEmptyImages));
      expect(state.items[0].image).toBeUndefined();
      expect(state.items[0].images).toEqual([]);
    });

    test('should increase quantity and update totals when adding existing product', () => {
      // Add first
      let state = cartReducer(initialState, addToCart(newItem));
      // Add same product again
      state = cartReducer(state, addToCart(newItem));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
      expect(state.items[0].totalPrice).toBe(160); // 2 * 80
      expect(state.totalQuantity).toBe(2);
      expect(state.totalAmount).toBe(160);
    });

    test('should correctly compute totals with multiple different products', () => {
      let state = cartReducer(initialState, addToCart(newItem)); // 1 * 80 = 80
      const secondItem = { id: 2, name: 'Second', price: 200 };
      state = cartReducer(state, addToCart(secondItem)); // 1 * 200 = 200
      expect(state.items).toHaveLength(2);
      expect(state.totalQuantity).toBe(2);
      expect(state.totalAmount).toBe(280);
    });

    test('should treat discountPrice = 0 as valid discount (free item)', () => {
      const freeItem = { id: 5, name: 'Freebie', price: 10, discountPrice: 0 };
      const state = cartReducer(initialState, addToCart(freeItem));
      expect(state.items[0].totalPrice).toBe(0);
      expect(state.totalAmount).toBe(0);
    });
  });

  // ---------- removeFromCart ----------
  describe('removeFromCart', () => {
    beforeEach(() => {
      // Prepopulate with two items
      initialState.items = [
        { id: 1, name: 'A', price: 100, discountPrice: 80, quantity: 2, totalPrice: 160, image: 'a.jpg', images: ['a.jpg'] },
        { id: 2, name: 'B', price: 200, quantity: 1, totalPrice: 200, image: 'b.jpg', images: ['b.jpg'] },
      ];
      initialState.totalQuantity = 3;
      initialState.totalAmount = 360;
    });

    test('should remove an existing item and recalculate totals', () => {
      const state = cartReducer(initialState, removeFromCart(1));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].id).toBe(2);
      expect(state.totalQuantity).toBe(1);
      expect(state.totalAmount).toBe(200);
    });

    test('should do nothing if id does not exist', () => {
      const state = cartReducer(initialState, removeFromCart(999));
      expect(state.items).toHaveLength(2);
      expect(state.totalQuantity).toBe(3);
      expect(state.totalAmount).toBe(360);
    });

    test('should handle removing the last item', () => {
      let state = cartReducer(initialState, removeFromCart(1));
      state = cartReducer(state, removeFromCart(2));
      expect(state.items).toEqual([]);
      expect(state.totalQuantity).toBe(0);
      expect(state.totalAmount).toBe(0);
    });
  });

  // ---------- increaseQuantity ----------
  describe('increaseQuantity', () => {
    beforeEach(() => {
      initialState.items = [
        { id: 1, name: 'A', price: 100, discountPrice: 80, quantity: 1, totalPrice: 80, image: 'a.jpg', images: ['a.jpg'] },
      ];
      initialState.totalQuantity = 1;
      initialState.totalAmount = 80;
    });

    test('should increase quantity and update totals', () => {
      const state = cartReducer(initialState, increaseQuantity(1));
      expect(state.items[0].quantity).toBe(2);
      expect(state.items[0].totalPrice).toBe(160); // 2 * 80
      expect(state.totalQuantity).toBe(2);
      expect(state.totalAmount).toBe(160);
    });

    test('should do nothing if id does not exist', () => {
      const state = cartReducer(initialState, increaseQuantity(999));
      expect(state.items[0].quantity).toBe(1);
      expect(state.totalQuantity).toBe(1);
      expect(state.totalAmount).toBe(80);
    });

    test('should use price when discountPrice is missing', () => {
      const itemNoDiscount = { id: 2, name: 'B', price: 200, quantity: 1, totalPrice: 200, image: 'b.jpg', images: ['b.jpg'] };
      let state = { ...initialState, items: [itemNoDiscount], totalQuantity: 1, totalAmount: 200 };
      state = cartReducer(state, increaseQuantity(2));
      expect(state.items[0].quantity).toBe(2);
      expect(state.items[0].totalPrice).toBe(400);
      expect(state.totalAmount).toBe(400);
    });
  });

  // ---------- decreaseQuantity ----------
  describe('decreaseQuantity', () => {
    beforeEach(() => {
      initialState.items = [
        { id: 1, name: 'A', price: 100, discountPrice: 80, quantity: 3, totalPrice: 240, image: 'a.jpg', images: ['a.jpg'] },
      ];
      initialState.totalQuantity = 3;
      initialState.totalAmount = 240;
    });

    test('should decrease quantity and update totals', () => {
      const state = cartReducer(initialState, decreaseQuantity(1));
      expect(state.items[0].quantity).toBe(2);
      expect(state.items[0].totalPrice).toBe(160); // 2 * 80
      expect(state.totalQuantity).toBe(2);
      expect(state.totalAmount).toBe(160);
    });

    test('should remove item when quantity becomes 1 and decreased', () => {
      const itemWithOne = { ...initialState.items[0], quantity: 1, totalPrice: 80 };
      let state = { ...initialState, items: [itemWithOne], totalQuantity: 1, totalAmount: 80 };
      state = cartReducer(state, decreaseQuantity(1));
      expect(state.items).toEqual([]);
      expect(state.totalQuantity).toBe(0);
      expect(state.totalAmount).toBe(0);
    });

    test('should do nothing if id does not exist', () => {
      const state = cartReducer(initialState, decreaseQuantity(999));
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(3);
      expect(state.totalQuantity).toBe(3);
      expect(state.totalAmount).toBe(240);
    });

    test('should handle multiple items and only decrease the correct one', () => {
      const secondItem = { id: 2, name: 'B', price: 50, quantity: 2, totalPrice: 100, image: 'b.jpg', images: ['b.jpg'] };
      let state = {
        items: [initialState.items[0], secondItem],
        totalQuantity: 5,
        totalAmount: 340, // 240 + 100
      };
      state = cartReducer(state, decreaseQuantity(1)); // decrease id 1
      expect(state.items[0].quantity).toBe(2);
      expect(state.items[0].totalPrice).toBe(160);
      expect(state.items[1].quantity).toBe(2); // unchanged
      expect(state.totalQuantity).toBe(4);
      expect(state.totalAmount).toBe(260); // 160 + 100
    });
  });

  // ---------- clearCart ----------
  describe('clearCart', () => {
    test('should reset cart to initial state', () => {
      const filledState = {
        items: [
          { id: 1, name: 'A', price: 100, quantity: 2, totalPrice: 200, image: 'a.jpg', images: ['a.jpg'] },
        ],
        totalQuantity: 2,
        totalAmount: 200,
      };
      const state = cartReducer(filledState, clearCart());
      expect(state).toEqual(initialState);
    });

    test('should work on already empty cart', () => {
      const state = cartReducer(initialState, clearCart());
      expect(state).toEqual(initialState);
    });
  });
});