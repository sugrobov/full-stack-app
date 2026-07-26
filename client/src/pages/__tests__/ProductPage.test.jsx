import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ProductPage from '../ProductPage';
import productsReducer, { fetchProductById } from '../../store/productsSlice';
import cartReducer from '../../store/cartSlice';
import favoritesReducer from '../../store/favoritesSlice';
import authReducer from '../../store/authSlice';
import toast from 'react-hot-toast';

// Mock the useSelector hook
vi.mock('../../store/productsSlice', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        fetchProductById: vi.fn(() => ({ type: 'products/fetchProductById/mocked' })),
    };
});

vi.mock('react-hot-toast', () => ({
    default: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock('../../components/Breadcrumb', () => ({ default: () => <div>Breadcrumb</div> }));
vi.mock('../../components/ProductPageSkeleton', () => ({ default: () => <div>Loading...</div> }));
vi.mock('../../components/Reviews', () => ({ default: ({ productId }) => <div>Reviews for {productId}</div> }));

const createMockStore = (state) =>
    configureStore({
        reducer: {
            products: productsReducer,
            cart: cartReducer,
            favorites: favoritesReducer,
            auth: authReducer,
        },
        preloadedState: state,
    });

const defaultState = {
    products: {
        items: [],
        currentProduct: null,
        status: 'idle',
        error: null,
        categories: [],
        currentPage: 1,
        itemsPerPage: 12,
        totalPages: 1,
        totalItems: 0,
        minPrice: '',
        maxPrice: '',
        selectedCategory: '',
        sort: 'default',
    },
    cart: { items: [], totalQuantity: 0 },
    favorites: { items: [] },
    auth: { user: null, token: null, isLoading: false, error: null },
};

const productData = {
    id: 42,
    name: 'Тестовый товар',
    price: 1000,
    discount_price: null,
    rating: 4,
    stock: 10,
    category_name: 'Категория',
    description: 'Описание товара',
    images: ['/images/test1.jpg', '/images/test2.jpg'],
    image: null,
};

const renderProductPage = (stateOverrides = {}, route = '/product/42') => {
    const state = {
        ...defaultState,
        ...stateOverrides,
        products: { ...defaultState.products, ...stateOverrides.products },
    };
    const store = createMockStore(state);
    return {
        ...render(
            <Provider store={store}>
                <MemoryRouter initialEntries={[route]}>
                    <Routes>
                        <Route path="/product/:id" element={<ProductPage />} />
                    </Routes>
                </MemoryRouter>
            </Provider>
        ),
        store,
    };
};

describe('ProductPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows skeleton while loading and no product', () => {
        renderProductPage({ products: { ...defaultState.products, status: 'loading', currentProduct: null } });
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows not found if product is missing after loading', () => {
        renderProductPage({ products: { ...defaultState.products, status: 'succeeded', currentProduct: null } });
        expect(screen.getByText('Товар не найден')).toBeInTheDocument();
    });

    it('renders product details when product exists in currentProduct', () => {
        const state = {
            products: {
                ...defaultState.products,
                status: 'succeeded',
                currentProduct: productData,
            },
        };
        renderProductPage(state);
        expect(screen.getByText('Тестовый товар')).toBeInTheDocument();
        expect(screen.getByText('1,000 ₽')).toBeInTheDocument();
        expect(screen.getByText('Описание товара')).toBeInTheDocument();
        expect(screen.getByText('10 шт.')).toBeInTheDocument();
    });

    it('renders product from items list if not in currentProduct', () => {
        const state = {
            products: {
                ...defaultState.products,
                items: [productData],
                status: 'succeeded',
                currentProduct: null,
            },
        };
        renderProductPage(state);
        expect(screen.getByText('Тестовый товар')).toBeInTheDocument();
    });

    it('can switch images and shows counter', () => {
        const state = {
            products: {
                ...defaultState.products,
                status: 'succeeded',
                currentProduct: productData,
            },
        };
        renderProductPage(state);
        // Initially shows first image: 1 / 2
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
        const thumb2 = screen.getByRole('button', { name: /миниатюра 2/i });
        fireEvent.click(thumb2);
        expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    it('adds to cart and shows toast when button clicked', () => {
        const state = {
            products: {
                ...defaultState.products,
                status: 'succeeded',
                currentProduct: productData,
            },
        };
        const { store } = renderProductPage(state);
        fireEvent.click(screen.getByText('Добавить в корзину'));
        expect(toast.success).toHaveBeenCalledWith('Тестовый товар добавлен в корзину');
        const cartItems = store.getState().cart.items;
        expect(cartItems.length).toBe(1);
        expect(cartItems[0].id).toBe(42);
    });

    it('toggles favorite and shows toast', () => {
        const state = {
            products: { ...defaultState.products, status: 'succeeded', currentProduct: productData },
            favorites: { items: [] },
        };
        const { store } = renderProductPage(state);
        const favButton = screen.getByText('В избранное');
        fireEvent.click(favButton);
        expect(toast.success).toHaveBeenCalledWith('Добавлено в избранное');
        expect(store.getState().favorites.items).toContain(42);
    });

    it('shows "В избранном" and toggles off when already favorite', () => {
        const state = {
            products: { ...defaultState.products, status: 'succeeded', currentProduct: productData },
            favorites: { items: [42] },
        };
        renderProductPage(state);
        expect(screen.getByText('В избранном')).toBeInTheDocument();
        fireEvent.click(screen.getByText('В избранном'));
        expect(toast.success).toHaveBeenCalledWith('Удалено из избранного');
    });

    it('shows "Нет в наличии" and disabled button when stock = 0', () => {
        const outOfStock = { ...productData, stock: 0 };
        const state = {
            products: { ...defaultState.products, status: 'succeeded', currentProduct: outOfStock },
        };
        renderProductPage(state);
        const buttons = screen.getAllByText('Нет в наличии');
        const button = buttons.find(el => el.tagName === 'BUTTON');
        expect(button).toBeDisabled();
    });

    it('renders Reviews component with productId', () => {
        const state = {
            products: { ...defaultState.products, status: 'succeeded', currentProduct: productData },
        };
        renderProductPage(state);
        expect(screen.getByText('Reviews for 42')).toBeInTheDocument();
    });
});