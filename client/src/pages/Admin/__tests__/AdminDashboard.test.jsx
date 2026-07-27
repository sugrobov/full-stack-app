import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from '../AdminDashboard';

describe('AdminDashboard', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );
  });

  it('renders dashboard heading', () => {
    expect(screen.getByText('Панель администратора')).toBeInTheDocument();
  });

  it('renders link to products', () => {
    const link = screen.getByTestId('link-products');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/products');
  });

  it('renders link to orders', () => {
    const link = screen.getByTestId('link-orders');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/orders');
  });

  it('renders link to users', () => {
    const link = screen.getByTestId('link-users');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/users');
  });

  it('renders link to reviews', () => {
    const link = screen.getByTestId('link-reviews');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/reviews');
  });
});