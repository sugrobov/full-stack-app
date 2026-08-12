import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import ProductCard from '../ProductCard';
import cartReducer from '../../store/cartSlice';
import favoritesReducer from '../../store/favoritesSlice';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const createMockStore = (preloadedState = {}) =>
  configureStore({
    reducer: {
      cart: cartReducer,
      favorites: favoritesReducer,
    },
    preloadedState,
  });

const renderWithProviders = (ui, { preloadedState, store } = {}) => {
  const testStore = store || createMockStore(preloadedState);
  return {
    ...render(
      <Provider store={testStore}>
        <MemoryRouter>{ui}</MemoryRouter>
      </Provider>
    ),
    store: testStore,
  };
};

const baseProduct = {
  id: 1,
  name: 'Тестовый товар',
  price: 1000,
  discount_price: null,
  rating: 4,
  stock: 5,
  category: 'Электроника',
  category_name: 'Электроника',
  images: ['/images/test.jpg'],
};

describe('ProductCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product name and price', () => {
    renderWithProviders(<ProductCard product={baseProduct} />);
    expect(screen.getByText('Тестовый товар')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('000') && content.includes('₽'))).toBeInTheDocument();
  });

  it('renders discounted price and savings', () => {
    const discounted = { ...baseProduct, discount_price: 800 };
    renderWithProviders(<ProductCard product={discounted} />);
    expect(screen.getByText('800 ₽')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('000') && content.includes('₽'))).toBeInTheDocument();
    expect(screen.getByText(/Экономия/)).toBeInTheDocument();
  });

  it('renders out of stock button when stock is 0', () => {
    const noStock = { ...baseProduct, stock: 0 };
    renderWithProviders(<ProductCard product={noStock} />);
    const button = screen.getByText('Нет в наличии');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('dispatches addToCart when "В корзину" button clicked', () => {
    const store = createMockStore();
    renderWithProviders(<ProductCard product={baseProduct} />, { store });
    const button = screen.getByText('В корзину');
    fireEvent.click(button);
    // Проверяем, что экшен addToCart был задиспатчен с правильным товаром
    const actions = store.getState().cart.items;
    expect(actions).toHaveLength(1);
    expect(actions[0].id).toBe(1);
    expect(toast.success).toHaveBeenCalledWith('Тестовый товар добавлен в корзину');
  });

  it('does not dispatch addToCart when out of stock', () => {
    const store = createMockStore();
    const noStock = { ...baseProduct, stock: 0 };
    renderWithProviders(<ProductCard product={noStock} />, { store });
    const button = screen.getByText('Нет в наличии');
    fireEvent.click(button);
    expect(store.getState().cart.items).toHaveLength(0);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('dispatches toggleFavorite when favorite button clicked', () => {
    const store = createMockStore({ favorites: { items: [] } });
    renderWithProviders(<ProductCard product={baseProduct} />, { store });
    const favButton = screen.getByRole('button', { name: /добавить в избранное/i });
    fireEvent.click(favButton);
    const state = store.getState().favorites.items;
    expect(state).toContain(1);
  });

  it('shows filled heart when product is favorite', () => {
    const store = createMockStore({ favorites: { items: [1] } });
    renderWithProviders(<ProductCard product={baseProduct} />, { store });
    const favButton = screen.getByRole('button', { name: /удалить из избранного/i });
    expect(favButton).toBeInTheDocument();
    const svg = favButton.querySelector('svg');
    // Проверяем, что fill = 'currentColor' (так как isFavorite true)
    expect(svg).toHaveAttribute('fill', 'currentColor');
  });

  it('renders placeholder when no valid image', () => {
    const noImage = { ...baseProduct, images: [], image: null };
    renderWithProviders(<ProductCard product={noImage} />);
    // Должен отрисоваться SVG-заглушка, а не img
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    // Проверяем наличие svg с текстом товара (можно по data-testid, но проще проверить, что нет img)
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders fallback on image error', () => {
    renderWithProviders(<ProductCard product={baseProduct} />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    // После ошибки должен показаться SVG-заглушка
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});