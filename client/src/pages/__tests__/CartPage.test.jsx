import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import CartPage from '../CartPage';
import cartReducer from '../../store/cartSlice';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const createMockStore = (preloadedState = {}) =>
    configureStore({
        reducer: { cart: cartReducer },
        preloadedState: { cart: preloadedState },
    });

const renderCart = (cartState) => {
    const store = createMockStore(cartState);
    return {
        ...render(
            <Provider store={store}>
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            </Provider>
        ),
        store,
    };
};

const sampleItem = (overrides = {}) => ({
    id: 1,
    name: 'Товар 1',
    price: 1000,
    discountPrice: null,
    image: '/images/test.jpg',
    images: ['/images/test.jpg'],
    quantity: 2,
    totalPrice: 2000,
    ...overrides,
});

const sampleItem2 = {
    id: 2,
    name: 'Товар 2',
    price: 500,
    discountPrice: 400,
    image: null,
    images: [],
    quantity: 1,
    totalPrice: 400,
};

describe('CartPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows empty cart message and link to shop', () => {
        renderCart({ items: [], totalQuantity: 0 });
        expect(screen.getByText('Ваша корзина пуста')).toBeInTheDocument();
        expect(screen.getByText('Добавьте товары в корзину, чтобы оформить заказ.')).toBeInTheDocument();
        const shopLink = screen.getByRole('link', { name: /перейти к покупкам/i });
        expect(shopLink).toHaveAttribute('href', '/');
    });

    it('renders cart items with names, prices, and controls', () => {
        const items = [sampleItem(), sampleItem2];
        renderCart({ items, totalQuantity: 3 });
        expect(screen.getByText('Товар 1')).toBeInTheDocument();
        expect(screen.getByText('Товар 2')).toBeInTheDocument();
        // Проверка скидочной цены
        // Скидочная цена отображается и в карточке товара, и в итоговой сумме — ищем все вхождения
        expect(screen.getAllByText('400 ₽').length).toBeGreaterThan(0);
        // Перечёркнутая обычная цена — только одна
        expect(screen.getByText('500 ₽')).toBeInTheDocument();
        // Обычная цена
        expect(screen.getByText(/1[\s,]000\s₽/)).toBeInTheDocument();
        // Итоговая сумма
        expect(screen.getAllByText('2400 ₽').length).toBeGreaterThan(0); // computedTotal = 2000+400=2400
    });

    it('calls increaseQuantity when + button clicked', () => {
        const items = [sampleItem()];
        const store = createMockStore({ items, totalQuantity: 2 });
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            </Provider>
        );
        const plusButton = screen.getByText('+');
        fireEvent.click(plusButton);
        const state = store.getState().cart.items;
        expect(state[0].quantity).toBe(3);
    });

    it('calls decreaseQuantity when - button clicked', () => {
        const items = [sampleItem()];
        const store = createMockStore({ items, totalQuantity: 2 });
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            </Provider>
        );
        const minusButton = screen.getByText('-');
        fireEvent.click(minusButton);
        const state = store.getState().cart.items;
        expect(state[0].quantity).toBe(1);
    });

    it('disables - button when quantity is 1', () => {
        const items = [sampleItem({ quantity: 1 })];
        renderCart({ items, totalQuantity: 1 });
        const minusButton = screen.getByText('-');
        expect(minusButton).toBeDisabled();
    });

    it('removes item when X button clicked and shows toast', () => {
        const items = [sampleItem()];
        const store = createMockStore({ items, totalQuantity: 2 });
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            </Provider>
        );
        // Кнопка с крестиком (svg внутри, ищем по role кнопки)
        const removeButtons = screen.getAllByRole('button').filter(btn => btn.querySelector('svg path[d*="M6 18L18 6"]'));
        fireEvent.click(removeButtons[0]);
        expect(toast.success).toHaveBeenCalledWith('Товар удалён из корзины');
        expect(store.getState().cart.items.length).toBe(0);
    });

    it('clears cart when "Очистить корзину" clicked', () => {
        const items = [sampleItem()];
        const store = createMockStore({ items, totalQuantity: 2 });
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <CartPage />
                </MemoryRouter>
            </Provider>
        );
        const clearButton = screen.getByText('Очистить корзину');
        fireEvent.click(clearButton);
        expect(toast.success).toHaveBeenCalledWith('Корзина очищена');
        expect(store.getState().cart.items.length).toBe(0);
    });

    it('has a link to checkout page', () => {
        renderCart({ items: [sampleItem()], totalQuantity: 2 });
        const checkoutLink = screen.getByRole('link', { name: /оформить заказ/i });
        expect(checkoutLink).toHaveAttribute('href', '/checkout');
    });
});