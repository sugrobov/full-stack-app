import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchPage from '../SearchPage';

global.fetch = vi.fn();

vi.mock('../../components/Breadcrumb', () => ({
  default: () => <div>Breadcrumb</div>,
}));
vi.mock('../../components/ProductCard', () => ({
  default: ({ product }) => <div data-testid={`product-card-${product.id}`}>{product.name}</div>,
}));
vi.mock('../../components/Pagination', () => ({
  default: ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="pagination">
      Page {currentPage} of {totalPages}
      <button onClick={() => onPageChange(2)}>Go to page 2</button>
    </div>
  ),
}));

const renderWithQuery = (query) => {
  const route = query ? `/?q=${encodeURIComponent(query)}` : '/';
  window.history.pushState({}, '', route);
  return render(
    <MemoryRouter initialEntries={[route]}>
      <SearchPage />
    </MemoryRouter>
  );
};

describe('SearchPage', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows no-query message when no q param', () => {
    renderWithQuery('');
    expect(screen.getByTestId('no-query')).toBeInTheDocument();
    expect(screen.getByText('Введите поисковый запрос')).toBeInTheDocument();
  });

  it('shows loading state initially', async () => {
    fetch.mockImplementationOnce(() => new Promise(() => {}));
    renderWithQuery('тест');
    expect(screen.getByTestId('loading-message')).toBeInTheDocument();
  });

  it('shows empty message when no products found', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: [], pagination: { totalItems: 0, currentPage: 1, totalPages: 1 } }),
    });
    renderWithQuery('ничего нет');

    await waitFor(() => {
      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
      expect(screen.getByText('Ничего не найдено. Попробуйте другой запрос.')).toBeInTheDocument();
    });
  });

  it('renders product list and pagination', async () => {
    const products = [
      { id: 1, name: 'Товар 1' },
      { id: 2, name: 'Товар 2' },
    ];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products,
        pagination: { totalItems: 2, currentPage: 1, totalPages: 1 },
      }),
    });
    renderWithQuery('успех');

    await waitFor(() => {
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
    });
    expect(screen.getByTestId('total-items')).toHaveTextContent('Найдено товаров: 2');
  });

  it('handles page change', async () => {
    const productsPage1 = [{ id: 1, name: 'Товар 1' }];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: productsPage1,
        pagination: { totalItems: 2, currentPage: 1, totalPages: 2 },
      }),
    });
    renderWithQuery('страницы');

    await waitFor(() => {
      expect(screen.getByTestId('product-card-1')).toBeInTheDocument();
    });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        products: [{ id: 2, name: 'Товар 2' }],
        pagination: { totalItems: 2, currentPage: 2, totalPages: 2 },
      }),
    });

    const page2Button = screen.getByText('Go to page 2');
    fireEvent.click(page2Button);

    await waitFor(() => {
      expect(screen.getByTestId('product-card-2')).toBeInTheDocument();
    });
  });

  it('shows error handling if fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    renderWithQuery('ошибка');

    await waitFor(() => {
      expect(screen.getByTestId('empty-message')).toBeInTheDocument();
    });
  });
});