import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';
import { vi } from 'vitest';
import AdminProducts from '../AdminProducts';

vi.mock('axios');
vi.mock('react-hot-toast');

vi.mock('../../../components/UI/TableSkeleton', () => ({
  default: () => <div data-testid="table-skeleton">Skeleton</div>,
}));
vi.mock('../../../components/UI/ConfirmModal', () => ({
  default: ({ isOpen, onClose, onConfirm, title, message }) =>
    isOpen ? (
      <div data-testid="confirm-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onConfirm}>Подтвердить</button>
        <button onClick={onClose}>Отмена</button>
      </div>
    ) : null,
}));
vi.mock('../../../components/UI/Button', () => ({
  default: ({ children, variant, size, onClick, className, type, ...props }) => (
    <button onClick={onClick} className={className} type={type} {...props}>
      {children}
    </button>
  ),
}));
vi.mock('../../../components/UI/BackToAdminButton', () => ({
  default: () => <a href="/admin">← Назад в админку</a>,
}));
vi.mock('../../../components/Pagination', () => ({
  default: ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="pagination">
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>
        Next
      </button>
    </div>
  ),
}));

const createTestStore = (authOverrides = {}) =>
  configureStore({
    reducer: {
      auth: () => ({ token: 'test-token', ...authOverrides }),
    },
  });

const renderComponent = (authOverrides = {}) => {
  const store = createTestStore(authOverrides);
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <AdminProducts />
      </MemoryRouter>
    </Provider>
  );
};

describe('AdminProducts', () => {
  const mockProducts = [
    { id: 1, name: 'Product A', category_id: 1, category_name: 'Category 1', price: 100, discount_price: 80, rating: 4.5, stock: 10 },
    { id: 2, name: 'Product B', category_id: 2, category_name: 'Category 2', price: 200, discount_price: null, rating: null, stock: 5 },
  ];
  const mockCategories = [
    { id: 1, name: 'Category 1' },
    { id: 2, name: 'Category 2' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes('/admin/products')) {
        return Promise.resolve({
          data: {
            products: mockProducts,
            pagination: { page: 1, limit: 10, totalPages: 1, totalItems: 2 },
          },
        });
      } else if (url.includes('/categories')) {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  test('shows skeleton while loading', async () => {
    renderComponent();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('table-skeleton')).not.toBeInTheDocument();
    });
  });

  test('renders products table after loading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
    });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('renders filters and reset filters button', async () => {
    renderComponent();
    await waitFor(() => screen.getByPlaceholderText('Поиск по названию'));
    expect(screen.getByPlaceholderText('Цена от (₽)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Цена до (₽)')).toBeInTheDocument();
    expect(screen.getByText('Сбросить фильтры')).toBeInTheDocument();
  });

  test('filters products by search', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Product A'));
    const searchInput = screen.getByPlaceholderText('Поиск по названию');
    fireEvent.change(searchInput, { target: { value: 'product b' } });
    expect(screen.queryByText('Product A')).not.toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
  });

  test('filters by category', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Product A'));
    const categorySelect = screen.getAllByRole('combobox')[1]; // второй select — фильтр категорий
    fireEvent.change(categorySelect, { target: { value: '2' } });
    expect(screen.queryByText('Product A')).not.toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
  });

  test('filters by price range', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Product A'));
    const minInput = screen.getByPlaceholderText('Цена от (₽)');
    const maxInput = screen.getByPlaceholderText('Цена до (₽)');
    fireEvent.change(minInput, { target: { value: '150' } });
    fireEvent.change(maxInput, { target: { value: '250' } });
    expect(screen.queryByText('Product A')).not.toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
  });

  test('resets filters when reset button clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Product A'));
    const searchInput = screen.getByPlaceholderText('Поиск по названию');
    fireEvent.change(searchInput, { target: { value: 'nothing' } });
    expect(screen.queryByText('Product A')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Сбросить фильтры'));
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(searchInput.value).toBe('');
  });

  test('adds a new product', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    renderComponent();
    await waitFor(() => screen.getByText('Добавить товар'));

    // Ищем форму и внутри неё селект категории
    const form = screen.getByRole('form'); // <form> имеет role="form"
    const categorySelect = within(form).getByRole('combobox', { name: /категория/i });

    fireEvent.change(screen.getByPlaceholderText('Название'), { target: { value: 'New Product' } });
    fireEvent.change(screen.getByPlaceholderText('Цена'), { target: { value: '300' } });
    fireEvent.change(screen.getByPlaceholderText('Количество'), { target: { value: '20' } });
    fireEvent.change(categorySelect, { target: { value: '1' } });

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/admin/products',
        expect.objectContaining({ name: 'New Product', category_id: '1', price: '300', stock: '20' }),
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith('Товар добавлен');
    });
  });

  test('edits a product via link and form', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Product A'));
    const editLink = screen.getAllByText('Редактировать')[0];
    expect(editLink.closest('a')).toHaveAttribute('href', '/admin/products/1/edit');
  });

  test('delete flow: opens confirm modal, confirms, calls delete API', async () => {
    axios.delete.mockResolvedValueOnce({ data: { success: true } });
    renderComponent();
    await waitFor(() => screen.getByText('Product A'));

    const deleteButtons = screen.getAllByRole('button', { name: /удалить товар/i });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    // Ищем текст с помощью регулярного выражения, т.к. сообщение содержит дополнительный текст
    expect(screen.getByText(/Вы уверены, что хотите удалить этот товар?/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Подтвердить'));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith('/api/admin/products/1', expect.any(Object));
      expect(toast.success).toHaveBeenCalledWith('Товар удалён');
    });
    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();
  });

  test('pagination triggers page change', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/admin/products')) {
        return Promise.resolve({
          data: {
            products: mockProducts,
            pagination: { page: 1, limit: 10, totalPages: 2, totalItems: 12 },
          },
        });
      } else if (url.includes('/categories')) {
        return Promise.resolve({ data: mockCategories });
      }
      return Promise.reject(new Error('not found'));
    });
    renderComponent();
    await waitFor(() => screen.getByTestId('pagination'));
    const nextPageBtn = screen.getByText('Next');
    expect(nextPageBtn).not.toBeDisabled();
    fireEvent.click(nextPageBtn);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        '/api/admin/products',
        expect.objectContaining({ params: { page: 2, limit: 10 } })
      );
    });
  });

  test('handles error during product loading gracefully', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByTestId('table-skeleton')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Product A')).not.toBeInTheDocument();
    expect(screen.getByText('Управление товарами')).toBeInTheDocument();
  });
});