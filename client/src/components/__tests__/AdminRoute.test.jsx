import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminRoute from '../AdminRoute';

vi.mock('react-redux', () => ({
  useSelector: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="navigate">{to}</div>,
  };
});

import { useSelector } from 'react-redux';

describe('AdminRoute', () => {
  it('redirects to / if not authenticated', () => {
    useSelector.mockReturnValue({ user: null });
    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin panel</div>
        </AdminRoute>
      </MemoryRouter>
    );
    expect(screen.getByTestId('navigate')).toHaveTextContent('/');
  });

  it('redirects to / if user is not admin', () => {
    useSelector.mockReturnValue({ user: { role: 'user' } });
    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin panel</div>
        </AdminRoute>
      </MemoryRouter>
    );
    expect(screen.getByTestId('navigate')).toHaveTextContent('/');
  });

  it('renders children for admin', () => {
    useSelector.mockReturnValue({ user: { role: 'admin' } });
    render(
      <MemoryRouter>
        <AdminRoute>
          <div>Admin panel</div>
        </AdminRoute>
      </MemoryRouter>
    );
    expect(screen.getByText('Admin panel')).toBeInTheDocument();
  });
});