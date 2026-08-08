import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test-utils.jsx';
import AppRoutes from '../../routes';

test('неавторизованный пользователь перенаправляется с /admin на /login', async () => {
  renderWithProviders(<AppRoutes />, {
    preloadedState: {
      auth: { user: null, isAuthenticated: false, loading: false, error: null },
    },
    initialEntries: ['/admin'],
  });

  await waitFor(() => {
    expect(screen.getByText(/вход/i)).toBeInTheDocument();
  });
  expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
});

test('авторизованный админ видит AdminDashboard', async () => {
  renderWithProviders(<AppRoutes />, {
    preloadedState: {
      auth: { user: { id: 1, name: 'Admin', role: 'admin' }, isAuthenticated: true, loading: false, error: null },
    },
    initialEntries: ['/admin'],
  });

  await waitFor(() => {
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
  });
});
