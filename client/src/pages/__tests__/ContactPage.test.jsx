import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import ContactPage from '../ContactPage';

vi.mock('axios');
vi.mock('../../components/Breadcrumb', () => ({
  default: () => <div>Breadcrumb</div>,
}));

describe('ContactPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <ContactPage />
      </MemoryRouter>
    );
  };

  it('renders form with fields and buttons', () => {
    renderPage();
    expect(screen.getByLabelText(/тема письма/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/текст сообщения/i)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /код с картинки/i })).toBeInTheDocument();
    expect(screen.getByTestId('captcha-display')).toBeInTheDocument();
    expect(screen.getByTestId('captcha-verify-button')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('reset-button')).toBeInTheDocument();
  });

it('submit button is disabled when captcha not verified', () => {
    renderPage();
    const submitBtn = screen.getByTestId('submit-button');
    expect(submitBtn).toBeDisabled();
});

it('does not show error when clicking disabled submit button', async () => {
    renderPage();
    const submitBtn = screen.getByTestId('submit-button');
    await userEvent.click(submitBtn);
    expect(screen.queryByTestId('submit-error')).not.toBeInTheDocument();
});

  it('verifies captcha correctly', async () => {
    renderPage();
    const captchaDisplay = screen.getByTestId('captcha-display');
    const captchaText = captchaDisplay.textContent.trim();
    const captchaInput = screen.getByRole('textbox', { name: /код с картинки/i });
    const verifyBtn = screen.getByTestId('captcha-verify-button');

    await userEvent.type(captchaInput, captchaText);
    await userEvent.click(verifyBtn);

    expect(screen.getByTestId('captcha-verified')).toBeInTheDocument();
    expect(screen.queryByTestId('submit-error')).not.toBeInTheDocument();
  });

  it('shows error on wrong captcha', async () => {
    renderPage();
    const captchaInput = screen.getByRole('textbox', { name: /код с картинки/i });
    const verifyBtn = screen.getByTestId('captcha-verify-button');

    await userEvent.type(captchaInput, '0000');
    await userEvent.click(verifyBtn);

    expect(screen.getByTestId('submit-error')).toHaveTextContent('Неверный код с картинки');
  });

  it('submits successfully and shows success message', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    renderPage();

    // Заполняем поля
    await userEvent.type(screen.getByLabelText(/тема письма/i), 'Тестовый вопрос');
    await userEvent.type(screen.getByLabelText(/текст сообщения/i), 'Длинное тестовое сообщение больше 10 символов');
    
    // Каптча: считываем число и вводим
    const captchaText = screen.getByTestId('captcha-display').textContent.trim();
    await userEvent.type(screen.getByRole('textbox', { name: /код с картинки/i }), captchaText);
    await userEvent.click(screen.getByTestId('captcha-verify-button'));
    
    // Отправляем
    const submitBtn = screen.getByTestId('submit-button');
    expect(submitBtn).not.toBeDisabled();
    await userEvent.click(submitBtn);

    // Ждём успеха
    await waitFor(() => {
      expect(screen.getByTestId('submit-success')).toBeInTheDocument();
    });
    expect(screen.getByText(/Сообщение отправлено!/i)).toBeInTheDocument();
    expect(screen.getByText(/Отправить еще одно сообщение/i)).toBeInTheDocument();
  });

  it('shows error if message too short', async () => {
    renderPage();
    // Заполняем, чтобы каптча была подтверждена
    const captchaText = screen.getByTestId('captcha-display').textContent.trim();
    await userEvent.type(screen.getByRole('textbox', { name: /код с картинки/i }), captchaText);
    await userEvent.click(screen.getByTestId('captcha-verify-button'));

    await userEvent.type(screen.getByLabelText(/тема письма/i), 'Короткая');
    await userEvent.type(screen.getByLabelText(/текст сообщения/i), 'Коротко');
    await userEvent.click(screen.getByTestId('submit-button'));

    expect(screen.getByTestId('submit-error')).toHaveTextContent(/слишком короткое/i);
  });

  it('shows error if subject too short', async () => {
    renderPage();
    const captchaText = screen.getByTestId('captcha-display').textContent.trim();
    await userEvent.type(screen.getByRole('textbox', { name: /код с картинки/i }), captchaText);
    await userEvent.click(screen.getByTestId('captcha-verify-button'));

    await userEvent.type(screen.getByLabelText(/тема письма/i), 'A');
    await userEvent.type(screen.getByLabelText(/текст сообщения/i), 'Достаточно длинное сообщение');
    await userEvent.click(screen.getByTestId('submit-button'));

    expect(screen.getByTestId('submit-error')).toHaveTextContent(/Тема сообщения слишком короткая/i);
  });

  it('clears form on reset', async () => {
    renderPage();
    // Вводим данные
    await userEvent.type(screen.getByLabelText(/тема письма/i), 'Тема');
    await userEvent.type(screen.getByLabelText(/текст сообщения/i), 'Сообщение');
    await userEvent.type(screen.getByRole('textbox', { name: /код с картинки/i }), '1234');
    
    // Жмём "Очистить"
    await userEvent.click(screen.getByTestId('reset-button'));

    expect(screen.getByLabelText(/тема письма/i)).toHaveValue('');
    expect(screen.getByLabelText(/текст сообщения/i)).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /код с картинки/i })).toHaveValue('');
  });

  it('handles server error on submit', async () => {
    axios.post.mockRejectedValueOnce({ response: { data: { error: 'Серверная ошибка' } } });
    renderPage();

    // Подтверждаем каптчу
    const captchaText = screen.getByTestId('captcha-display').textContent.trim();
    await userEvent.type(screen.getByRole('textbox', { name: /код с картинки/i }), captchaText);
    await userEvent.click(screen.getByTestId('captcha-verify-button'));

    await userEvent.type(screen.getByLabelText(/тема письма/i), 'Тема');
    await userEvent.type(screen.getByLabelText(/текст сообщения/i), 'Достаточно длинное сообщение');
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('submit-error')).toHaveTextContent('Серверная ошибка');
    });
  });
});