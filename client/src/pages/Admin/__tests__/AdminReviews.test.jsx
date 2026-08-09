// client/src/pages/Admin/__tests__/AdminReviews.test.jsx

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import toast from 'react-hot-toast';
import { vi } from 'vitest';
import AdminReviews from '../AdminReviews';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
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
vi.mock('../../../utils/dateUtils', () => ({
  formatRelativeDate: () => '2025-01-01',
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
        <AdminReviews />
      </MemoryRouter>
    </Provider>
  );
};

describe('AdminReviews', () => {
  const mockReviews = [
    { id: 1, product_name: 'Product A', product_id: 101, user_name: 'User1', user_email: 'user1@test.com', rating: 4, comment: 'Great!', is_approved: 1, created_at: '2025-01-01' },
    { id: 2, product_name: 'Product B', product_id: 102, user_name: 'User2', user_email: 'user2@test.com', rating: 2, comment: null, is_approved: 0, created_at: '2025-01-02' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({
      data: {
        reviews: mockReviews,
        pagination: { totalPages: 1, page: 1 },
      },
    });
  });

  test('shows skeleton while loading', async () => {
    renderComponent();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('table-skeleton')).not.toBeInTheDocument();
    });
  });

  test('renders reviews table after loading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/Product A/)).toBeInTheDocument();
      expect(screen.getByText(/User1/)).toBeInTheDocument();
    });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('filters input fields and button present', async () => {
    renderComponent();
    await waitFor(() => screen.getByPlaceholderText('Поиск (товар, пользователь, комментарий)'));
    expect(screen.getByPlaceholderText('ID товара')).toBeInTheDocument();
    expect(screen.getByText('Сбросить фильтры')).toBeInTheDocument();
  });

  test('toggles select all checkbox', async () => {
    renderComponent();
    await waitFor(() => screen.getByText(/Product A/));
    const selectAllCheckbox = screen.getByLabelText('Выбрать все отзывы');
    fireEvent.click(selectAllCheckbox);
    expect(screen.getByLabelText('Выбрать отзыв 1')).toBeChecked();
    expect(screen.getByLabelText('Выбрать отзыв 2')).toBeChecked();
  });

  test('opens edit modal, submits changes', async () => {
    axios.put.mockResolvedValueOnce({});
    renderComponent();
    await waitFor(() => screen.getByText(/Product A/));
    const editButtons = screen.getAllByLabelText('Редактировать отзыв');
    fireEvent.click(editButtons[0]);
    expect(screen.getByText('Редактировать отзыв')).toBeInTheDocument();

    const ratingSelect = screen.getByLabelText('Рейтинг');
    fireEvent.change(ratingSelect, { target: { value: '5' } });
    fireEvent.click(screen.getByText('Сохранить'));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringMatching(/\/admin\/reviews\/1$/),
        expect.objectContaining({ rating: 5, comment: 'Great!', is_approved: 1 }),
        expect.any(Object)
      );
    });
  });

  test('toggles approve status of a review', async () => {
    axios.patch.mockResolvedValueOnce({});
    renderComponent();
    await waitFor(() => screen.getByText(/Product A/));
    const hideButtons = screen.getAllByLabelText('Скрыть отзыв');
    fireEvent.click(hideButtons[0]);
    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringMatching(/\/admin\/reviews\/1\/toggle-approve$/),
        {},
        expect.any(Object)
      );
    });
  });

  test('delete single review via confirm modal', async () => {
    axios.delete.mockResolvedValueOnce({});
    renderComponent();
    await waitFor(() => screen.getByText(/Product A/));
    const deleteButtons = screen.getAllByLabelText('Удалить отзыв');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    expect(screen.getByText(/Вы уверены, что хотите удалить этот отзыв?/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Подтвердить'));
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringMatching(/\/admin\/reviews\/1$/),
        expect.any(Object)
      );
      expect(toast.success).toHaveBeenCalledWith('Отзыв удалён');
    });
  });

  test('bulk delete flow: select, open modal, confirm', async () => {
    axios.delete.mockResolvedValueOnce({});
    renderComponent();
    await waitFor(() => screen.getByText(/Product A/));

    const checkbox1 = screen.getByLabelText('Выбрать отзыв 1');
    fireEvent.click(checkbox1);
    const bulkDeleteBtn = screen.getByLabelText('Удалить выбранные отзывы');
    expect(bulkDeleteBtn).not.toBeDisabled();
    fireEvent.click(bulkDeleteBtn);

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Подтвердить'));

    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringMatching(/\/admin\/reviews\/bulk$/),
        { data: { ids: [1] }, headers: expect.any(Object) }
      );
      expect(toast.success).toHaveBeenCalledWith('1 отзыв(ов) удалено');
    });
  });

  test('pagination works when multiple pages', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        reviews: mockReviews,
        pagination: { totalPages: 2, page: 1 },
      },
    });
    renderComponent();
    await waitFor(() => screen.getByLabelText('Следующая страница'));
    fireEvent.click(screen.getByLabelText('Следующая страница'));
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });
});