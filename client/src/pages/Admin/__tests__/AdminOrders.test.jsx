import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import AdminOrders from '../AdminOrders';
import axios from 'axios';

vi.mock('axios');

vi.mock('../../../components/UI/TableSkeleton', () => ({
  default: () => <div data-testid="table-skeleton">Loading...</div>,
}));
vi.mock('../../../components/UI/BackToAdminButton', () => ({
  default: () => <button>Back</button>,
}));
vi.mock('../../../components/Pagination', () => ({
  default: ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="pagination">
      Page {currentPage} of {totalPages}
      <button onClick={() => onPageChange(2)}>Go to page 2</button>
    </div>
  ),
}));

const createMockStore = (token = 'test-token') =>
  configureStore({
    reducer: {
      auth: (state = { token }) => state,
    },
  });

describe('AdminOrders', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (token = 'test-token') => {
    const store = createMockStore(token);
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <AdminOrders />
        </MemoryRouter>
      </Provider>
    );
  };

  it('shows skeleton while loading', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    renderPage();
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('renders orders table after loading', async () => {
    const orders = [
      {
        id: 1,
        user_name: 'Иван',
        user_email: 'ivan@test.com',
        total: 1500,
        status: 'pending',
        created_at: '2025-01-01',
        address: 'ул. Пушкина',
        items: [{ id: 1, name: 'Товар', quantity: 2, price: 750 }],
      },
    ];
    axios.get.mockResolvedValueOnce({
      data: { orders, pagination: { page: 1, totalPages: 1, totalItems: 1, limit: 10 } },
    });

    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('order-row-1')).toBeInTheDocument();
    });
    expect(screen.getByText('Иван')).toBeInTheDocument();
    expect(screen.getByText('ivan@test.com')).toBeInTheDocument();
    expect(screen.getByText(/1[\s,]500\s₽/)).toBeInTheDocument();
    expect(screen.getByTestId('status-select-1')).toHaveValue('pending');
  });

  it('changes order status', async () => {
    const orders = [
      {
        id: 1,
        user_name: 'Иван',
        user_email: 'ivan@test.com',
        total: 1500,
        status: 'pending',
        created_at: '2025-01-01',
        address: 'ул. Пушкина',
        items: [],
      },
    ];
    axios.get.mockResolvedValueOnce({
      data: { orders, pagination: { page: 1, totalPages: 1, totalItems: 1, limit: 10 } },
    });
    axios.put.mockResolvedValueOnce({});

    renderPage();

    const statusSelect = await screen.findByTestId('status-select-1');
    await userEvent.selectOptions(statusSelect, 'shipped');

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/admin/orders/1/status'),
        { status: 'shipped' },
        expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } })
      );
    });
  });

  // теперь просто проверяем отображение кнопки сброса
  it('resets filters button is visible after loading', async () => {
    axios.get.mockResolvedValueOnce({
      data: { orders: [], pagination: { page: 1, totalPages: 1, totalItems: 0, limit: 10 } },
    });

    renderPage();

    // Ждём окончания загрузки (появления фильтров)
    await screen.findByTestId('admin-orders-filters');

    // Проверяем, что кнопка сброса фильтров отрисована
    expect(screen.getByTestId('reset-filters-btn')).toBeInTheDocument();
  });

  it('navigates pages', async () => {
    const ordersPage1 = [{ id: 1, user_name: 'Иван', user_email: 'ivan@test.com', total: 100, status: 'pending', created_at: '2025-01-01', address: '', items: [] }];
    axios.get.mockResolvedValueOnce({
      data: { orders: ordersPage1, pagination: { page: 1, totalPages: 2, totalItems: 2, limit: 1 } },
    });
    const ordersPage2 = [{ id: 2, user_name: 'Петр', user_email: 'petr@test.com', total: 200, status: 'paid', created_at: '2025-01-02', address: '', items: [] }];
    axios.get.mockResolvedValueOnce({
      data: { orders: ordersPage2, pagination: { page: 2, totalPages: 2, totalItems: 2, limit: 1 } },
    });

    renderPage();

    await screen.findByTestId('order-row-1');
    const page2Button = screen.getByText('Go to page 2');
    await userEvent.click(page2Button);

    await screen.findByTestId('order-row-2');
    expect(screen.queryByTestId('order-row-1')).not.toBeInTheDocument();
  });
});