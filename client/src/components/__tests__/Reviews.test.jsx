import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import axios from 'axios';
import Reviews from '../Reviews';

vi.mock('axios');

vi.mock('../ReviewSkeleton', () => ({ default: () => <div>Skeleton</div> }));
vi.mock('../../utils/dateUtils', () => ({
  formatRelativeDate: (date) => '2 дня назад',
}));

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const createMockStore = (authState = { user: null, token: null }) =>
  configureStore({
    reducer: { auth: (state = authState) => state },
    preloadedState: { auth: authState },
  });

const mockReviews = [
  { id: 1, user_id: 10, user_name: 'User1', rating: 5, comment: 'Отлично!', created_at: '2025-01-01' },
  { id: 2, user_id: 20, user_name: 'User2', rating: 3, comment: 'Нормально', created_at: '2025-01-02' },
];

const mockAvgResponse = {
  data: {
    reviews: [
      { rating: 5 },
      { rating: 4 },
      { rating: 3 },
    ],
    pagination: { totalPages: 1 },
  },
};

describe('Reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValueOnce({ data: { reviews: mockReviews, pagination: { totalPages: 1 } } }); // первый вызов для fetchReviews
    axios.get.mockResolvedValueOnce(mockAvgResponse); // второй вызов для fetchAvgRating
  });

  it('shows skeletons while loading initially', () => {
    // Чтобы показать скелетоны, нужно чтобы reviews.length === 0 и loading === true
    // Но после монтирования сразу два запроса, первый быстро резолвится. Поэтому сделаем так, что запросы висят.
    axios.get.mockReset();
    axios.get.mockImplementation(() => new Promise(() => {})); // никогда не резолвится
    render(
      <Provider store={createMockStore()}>
        <Reviews productId={1} />
      </Provider>
    );
    expect(screen.getAllByText('Skeleton').length).toBe(3);
  });

  it('fetches and displays reviews', async () => {
    render(
      <Provider store={createMockStore()}>
        <Reviews productId={1} />
      </Provider>
    );
    await waitFor(() => {
      expect(screen.getByText('Отлично!')).toBeInTheDocument();
      expect(screen.getByText('Нормально')).toBeInTheDocument();
      expect(screen.getByText('User1')).toBeInTheDocument();
    });
  });

  it('shows average rating', async () => {
    render(
      <Provider store={createMockStore()}>
        <Reviews productId={1} />
      </Provider>
    );
    await waitFor(() => {
      expect(screen.getByText('4.0 / 5')).toBeInTheDocument();
    });
  });

  it('shows "Пока нет отзывов" when reviews empty', async () => {
    axios.get.mockReset();
    axios.get.mockResolvedValueOnce({ data: { reviews: [], pagination: { totalPages: 0 } } });
    axios.get.mockResolvedValueOnce({ data: { reviews: [], pagination: { totalPages: 0 } } });
    render(
      <Provider store={createMockStore()}>
        <Reviews productId={1} />
      </Provider>
    );
    await waitFor(() => {
      expect(screen.getByText('Пока нет отзывов. Будьте первым!')).toBeInTheDocument();
    });
  });

  it('allows a logged-in user to submit a review', async () => {
    axios.post.mockResolvedValueOnce({});
    const store = createMockStore({ user: { id: 5, name: 'John' }, token: 'token' });
    render(
      <Provider store={store}>
        <Reviews productId={1} />
      </Provider>
    );
    await waitFor(() => screen.getByText('Оставить отзыв'));
    fireEvent.change(screen.getByPlaceholderText('Ваш отзыв...'), { target: { value: 'Хороший товар' } });
    fireEvent.click(screen.getByText('Отправить'));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/products/1/reviews'),
        { rating: 5, comment: 'Хороший товар' },
        { headers: { Authorization: 'Bearer token' } }
      );
    });
  });

  it('shows error if user not logged in and tries to submit', async () => {
    render(
      <Provider store={createMockStore()}>
        <Reviews productId={1} />
      </Provider>
    );
    await waitFor(() => screen.getByText('Войдите, чтобы оставить отзыв.'));
    // Пытаемся отправить – формы нет
    expect(screen.queryByPlaceholderText('Ваш отзыв...')).not.toBeInTheDocument();
  });

  it('allows admin to delete a review', async () => {
    window.confirm = vi.fn(() => true);
    axios.delete.mockResolvedValueOnce({});
    const store = createMockStore({ user: { id: 99, role: 'admin' }, token: 'adminToken' });
    render(
      <Provider store={store}>
        <Reviews productId={1} />
      </Provider>
    );
    await waitFor(() => screen.getByText('Отлично!'));
    const deleteButtons = screen.getAllByText('Удалить');
    expect(deleteButtons.length).toBe(2); // оба отзыва могут быть удалены админом
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => {
      expect(axios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/reviews/1'),
        { headers: { Authorization: 'Bearer adminToken' } }
      );
    });
  });
});