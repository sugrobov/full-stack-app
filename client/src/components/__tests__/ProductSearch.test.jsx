import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProductSearch from '../ProductSearch';

// Мокаем useDebounce, возвращая переданное значение мгновенно
vi.mock('../../hooks/useDebounce', () => ({
  useDebounce: (value) => value,
}));

// Мокаем fetch
global.fetch = vi.fn();

const mockProducts = [
  {
    id: 1,
    name: 'Товар 1',
    price: 1000,
    discount_price: null,
    images: ['/images/test.jpg'],
    image: null,
  },
  {
    id: 2,
    name: 'Товар 2',
    price: 2000,
    discount_price: 1500,
    images: [],
    image: null,
  },
];

describe('ProductSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ products: mockProducts }),
    });
  });

  it('renders input field', () => {
    render(
      <MemoryRouter>
        <ProductSearch />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('Поиск товаров...')).toBeInTheDocument();
  });

  it('fetches and shows results after typing', async () => {
    render(
      <MemoryRouter>
        <ProductSearch />
      </MemoryRouter>
    );
    const input = screen.getByPlaceholderText('Поиск товаров...');
    fireEvent.change(input, { target: { value: 'тест' } });

    await waitFor(() => {
      expect(screen.getByText('Товар 1')).toBeInTheDocument();
      expect(screen.getByText('Товар 2')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/products/search?q=%D1%82%D0%B5%D1%81%D1%82&limit=5')
    );
  });

  it('does not show dropdown while request is pending', async () => {
    global.fetch.mockImplementation(() => new Promise(() => {})); // никогда не резолвится
    render(
      <MemoryRouter>
        <ProductSearch />
      </MemoryRouter>
    );
    const input = screen.getByPlaceholderText('Поиск товаров...');
    fireEvent.change(input, { target: { value: 'тест' } });

    // Проверяем, что fetch был вызван
    expect(global.fetch).toHaveBeenCalled();
    // Выпадающий список не должен отображаться, пока запрос не завершён
    expect(screen.queryByText('Загрузка...')).not.toBeInTheDocument();
    expect(screen.queryByText('Товар 1')).not.toBeInTheDocument();
  });

  it('shows "Ничего не найдено" for empty results', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ products: [] }),
    });
    render(
      <MemoryRouter>
        <ProductSearch />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Поиск товаров...'), { target: { value: 'xxx' } });
    expect(await screen.findByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('clears search and closes dropdown when clear button clicked', async () => {
    render(
      <MemoryRouter>
        <ProductSearch />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Поиск товаров...'), { target: { value: 'test' } });
    await screen.findByText('Товар 1');

    const clearButton = screen.getByRole('button', { name: /очистить поиск/i });
    fireEvent.click(clearButton);

    expect(screen.queryByText('Товар 1')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Поиск товаров...').value).toBe('');
  });

  it('renders product with discount price', async () => {
    render(
      <MemoryRouter>
        <ProductSearch />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Поиск товаров...'), { target: { value: 'тест' } });
    await screen.findByText('Товар 2');
    expect(screen.getByText('1,500 ₽')).toBeInTheDocument();
    expect(screen.getByText('2,000 ₽')).toBeInTheDocument();
  });

  it('renders product without image placeholder', async () => {
    render(
      <MemoryRouter>
        <ProductSearch />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Поиск товаров...'), { target: { value: 'тест' } });
    await screen.findByText('Товар 2');
    // Товар 2 без изображения – должен быть svg-заглушка с текстом "Нет фото"
    expect(screen.getByText('Нет фото')).toBeInTheDocument();
  });
});