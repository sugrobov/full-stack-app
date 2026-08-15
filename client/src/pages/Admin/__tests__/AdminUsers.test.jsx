import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import { vi } from 'vitest';
import AdminUsers from '../AdminUsers';

vi.mock('axios');

vi.mock('../../../components/UI/BackToAdminButton', () => ({
  default: () => <a href="/admin">← Назад в админку</a>,
}));
vi.mock('../../../components/Pagination', () => ({
  default: ({ currentPage, totalPages, onPageChange }) => (
    <div data-testid="pagination">
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages}>Next</button>
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
        <AdminUsers />
      </MemoryRouter>
    </Provider>
  );
};

describe('AdminUsers', () => {
  const mockUsers = [
    { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user', created_at: '2025-01-01' },
    { id: 2, name: 'Bob', email: 'bob@example.com', role: 'admin', created_at: '2025-01-02' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({
      data: {
        users: mockUsers,
        pagination: { page: 1, limit: 10, totalPages: 1, totalItems: 2 },
      },
    });
  });

  test('shows loading state initially', async () => {
    renderComponent();
    expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    });
  });

  test('renders users table after loading', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('role select changes trigger PUT request', async () => {
    axios.put.mockResolvedValueOnce({});
    renderComponent();
    await waitFor(() => screen.getByText('Alice'));

    const roleSelect = screen.getByLabelText('Роль пользователя Alice');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users/1/role'),
        { role: 'admin' },
        expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } })
      );
    });
  });

  test('pagination triggers page change', async () => {
    axios.get.mockResolvedValue({
      data: {
        users: mockUsers,
        pagination: { page: 1, limit: 10, totalPages: 2, totalItems: 12 },
      },
    });
    renderComponent();
    await waitFor(() => screen.getByTestId('pagination'));
    const nextPageBtn = screen.getByText('Next');
    fireEvent.click(nextPageBtn);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/users'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
          params: { page: 2, limit: 10 }
        })
      );
    });
  });

  test('handles error during fetch gracefully', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    });
    // таблица пустая, заголовок виден
    expect(screen.getByText('Управление пользователями')).toBeInTheDocument();
  });
});