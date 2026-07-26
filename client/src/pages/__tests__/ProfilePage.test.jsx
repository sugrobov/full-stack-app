import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProfilePage from '../ProfilePage';
import axios from 'axios';

vi.mock('axios');
vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn() },
}));
vi.mock('../../utils/dateUtils', () => ({
  formatRelativeDate: () => '01.01.2025',
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const createMockStore = (authState) =>
  configureStore({
    reducer: {
      auth: (state = authState) => state,
    },
  });

describe('ProfilePage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (authOverrides = {}, initialEntries = ['/profile']) => {
    const defaultAuth = {
      user: { name: 'Иван', email: 'ivan@test.com', role: 'user' },
      token: 'test-token',
    };
    const auth = { ...defaultAuth, ...authOverrides };
    const store = createMockStore(auth);
    axios.get.mockResolvedValue({ data: [] }); // по умолчанию заказов нет
    return render(
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          <ProfilePage />
        </MemoryRouter>
      </Provider>
    );
  };

  it('redirects to /login if user is null', () => {
    renderPage({ user: null });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('renders user name and email in form', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByLabelText(/Имя/i)).toHaveValue('Иван');
    });
    expect(screen.getByLabelText(/Email/i)).toHaveValue('ivan@test.com');
  });

  it('fetches and displays orders', async () => {
    const orders = [
      {
        id: 1,
        created_at: '2025-01-01',
        total: 1500,
        status: 'pending',
        address: 'ул. Пушкина',
        items: JSON.stringify([{ name: 'Товар', quantity: 2, price: 750 }]),
      },
    ];
    axios.get.mockResolvedValueOnce({ data: orders });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Заказ №1/i)).toBeInTheDocument();
    });

    // Изменено: поиск суммы через data-testid, чтобы избежать конфликта с деталями заказа
    const totalElement = screen.getByTestId('order-total');
    expect(totalElement).toHaveTextContent('Сумма: 1,500 ₽');

    expect(screen.getByText(/Оформлен/i)).toBeInTheDocument();
    expect(screen.getByText(/ул. Пушкина/i)).toBeInTheDocument();
    expect(screen.getByText('Состав заказа')).toBeInTheDocument();
  });

  it('shows "no orders" message when empty', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/У вас пока нет заказов/i)).toBeInTheDocument();
    });
  });

  it('shows order success message when URL has orderSuccess=true', async () => {
    renderPage({}, ['/profile?orderSuccess=true']);
    await waitFor(() => {
      expect(screen.getByText(/Заказ успешно оформлен!/i)).toBeInTheDocument();
    });
  });

  it('updates profile successfully', async () => {
    axios.put.mockResolvedValue({});
    renderPage();

    const nameInput = screen.getByLabelText(/Имя/i);
    const submitBtn = screen.getByRole('button', { name: /Сохранить изменения/i });

    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Петр');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/users/profile'),
        { name: 'Петр', email: 'ivan@test.com' },
        expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } })
      );
      expect(screen.getByText(/Профиль обновлён/i)).toBeInTheDocument();
    });
  });

  it('shows error on profile update failure', async () => {
    axios.put.mockRejectedValue({ response: { data: { error: 'Ошибка сервера' } } });
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /Сохранить изменения/i }));
    await waitFor(() => {
      expect(screen.getByText('Ошибка сервера')).toBeInTheDocument();
    });
  });

  it('shows error if new password is too short', async () => {
    renderPage();

    // Изменено: заполняем текущий пароль, чтобы обязательное поле не мешало отправке
    const currentPassInput = screen.getByLabelText(/Текущий пароль/i);
    const newPassInput = screen.getByLabelText(/Новый пароль/i);
    const changePassBtn = screen.getByRole('button', { name: /Сменить пароль/i });

    await userEvent.type(currentPassInput, 'anypass');
    await userEvent.type(newPassInput, '12345');
    await userEvent.click(changePassBtn);

    // Ошибка должна появиться синхронно, но find подождёт
    const errorElement = await screen.findByText(/Новый пароль должен быть не менее 6 символов/i);
    expect(errorElement).toBeInTheDocument();
    expect(axios.put).not.toHaveBeenCalled();
  });

  it('changes password successfully', async () => {
    axios.put.mockResolvedValue({});
    renderPage();

    const currentPassInput = screen.getByLabelText(/Текущий пароль/i);
    const newPassInput = screen.getByLabelText(/Новый пароль/i);
    const changePassBtn = screen.getByRole('button', { name: /Сменить пароль/i });

    await userEvent.type(currentPassInput, 'oldpass');
    await userEvent.type(newPassInput, 'newpass');
    await userEvent.click(changePassBtn);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/users/password'),
        { currentPassword: 'oldpass', newPassword: 'newpass' },
        expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } })
      );
      expect(screen.getByText(/Пароль изменён/i)).toBeInTheDocument();
    });
    expect(currentPassInput).toHaveValue('');
    expect(newPassInput).toHaveValue('');
  });
});