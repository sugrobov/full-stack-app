import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test-utils.jsx';
import App from '../../App';

test('неавторизованный пользователь перенаправляется с /admin на главную', async () => {
  renderWithProviders(<App />, {
    preloadedState: {
      auth: { user: null, token: null, isLoading: false, error: null },
    },
    initialEntries: ['/admin'],
  });

  // После редиректа должна отобразиться главная страница, а не админка
  await waitFor(() => {
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });
  expect(screen.queryByTestId('admin-dashboard')).not.toBeInTheDocument();
});

test('авторизованный админ видит AdminDashboard', async () => {
  renderWithProviders(<App />, {
    preloadedState: {
      auth: {
        user: { id: 1, name: 'Admin', role: 'admin' },
        token: 'abc',
        isLoading: false,
        error: null,
      },
    },
    initialEntries: ['/admin'],
  });

  await waitFor(() => {
    expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
  });
});