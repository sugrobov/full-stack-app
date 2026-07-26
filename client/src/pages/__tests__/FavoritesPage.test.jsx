import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import FavoritesPage from '../FavoritesPage';

vi.mock('axios');
vi.mock('../../components/ProductCard', () => ({
  default: ({ product }) => <div data-testid={`product-card-${product.id}`}>{product.name}</div>,
}));

const createMockStore = (favoritesItems = [], authToken = 'test-token') =>
  configureStore({
    reducer: {
      favorites: (state = { items: favoritesItems }) => state,
      auth: (state = { token: authToken }) => state,
    },
  });

describe('FavoritesPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (favoriteIds = [], token = 'test-token') => {
    const store = createMockStore(favoriteIds, token);
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <FavoritesPage />
        </MemoryRouter>
      </Provider>
    );
  };

  it('shows loading state initially', async () => {
    // Промис, который никогда не разрешится, удерживает loading: true
    axios.post.mockImplementation(() => new Promise(() => {}));
    renderPage([1, 2, 3]);

    // Ждём, пока useEffect установит loading=true и рендерит loading-message
    await waitFor(() => {
      expect(screen.getByTestId('loading-message')).toBeInTheDocument();
    });
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
  });

  it('shows empty message when no favorites', async () => {
    axios.post.mockResolvedValue({ data: [] });
    renderPage([]);

    await waitFor(() => {
      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
    });
    expect(screen.getByText('У вас пока нет избранных товаров.')).toBeInTheDocument();
    expect(screen.getByText('Перейти в каталог')).toHaveAttribute('href', '/');
  });

  it('renders favorite products and removes one', async () => {
    const products = [
      { id: 1, name: 'Товар 1' },
      { id: 2, name: 'Товар 2' },
    ];
    axios.post.mockResolvedValueOnce({ data: products });

    renderPage([1, 2]);

    await waitFor(() => {
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
    });

    const removeButton = screen.getByTestId('remove-favorite-1');
    expect(removeButton).toHaveAttribute('aria-label', 'Удалить Товар 1 из избранного');

    await userEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByTestId('product-card-1')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
  });

  it('shows loading then products when ids change', async () => {
    let resolvePromise;
    const promise = new Promise(resolve => { resolvePromise = resolve; });
    axios.post.mockReturnValueOnce(promise);

    renderPage([3]);

    // Ждём появления loading
    await waitFor(() => {
      expect(screen.getByTestId('loading-message')).toBeInTheDocument();
    });

    // Разрешаем промис с данными
    resolvePromise({ data: [{ id: 3, name: 'Новый товар' }] });

    // Ждём, когда продукты отобразятся, а loading исчезнет
    await waitFor(() => {
      expect(screen.getByTestId('product-card-3')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('loading-message')).not.toBeInTheDocument();
  });
});