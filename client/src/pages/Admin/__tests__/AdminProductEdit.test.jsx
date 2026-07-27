import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminProductEdit from '../AdminProductEdit';
import axios from 'axios';

vi.mock('axios');
vi.mock('../../Products/components/ProductImageUpload', () => ({
  default: ({ images, onImagesChanged }) => (
    <div data-testid="image-upload-mock">
      Image Upload Mock
    </div>
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderComponent = (id = '1') => {
  return render(
    <MemoryRouter initialEntries={[`/admin/products/${id}/edit`]}>
      <Routes>
        <Route path="/admin/products/:id/edit" element={<AdminProductEdit />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('AdminProductEdit', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    renderComponent();
    expect(screen.getByTestId('loading-message')).toBeInTheDocument();
  });

  it('renders form with product data after loading', async () => {
    const productData = {
      id: 1,
      name: 'Тестовый товар',
      category_id: '2',
      price: '100',
      discount_price: '80',
      stock: '10',
      description: 'Описание товара',
      images: [],
    };
    const categoriesData = [
      { id: '1', name: 'Категория 1' },
      { id: '2', name: 'Категория 2' },
    ];

    axios.get
      .mockResolvedValueOnce({ data: productData })
      .mockResolvedValueOnce({ data: categoriesData });

    renderComponent();

    // Ждём, пока форма отобразится
    await screen.findByTestId('admin-product-edit-form');

    expect(screen.getByTestId('product-name-input')).toHaveValue('Тестовый товар');
    expect(screen.getByTestId('product-category-select')).toHaveValue('2');
    expect(screen.getByTestId('product-price-input')).toHaveValue(100);
    expect(screen.getByTestId('product-discount-price-input')).toHaveValue(80);
    expect(screen.getByTestId('product-stock-input')).toHaveValue(10);
    expect(screen.getByTestId('product-description-textarea')).toHaveValue('Описание товара');
  });

  it('saves updated product', async () => {
    const productData = {
      id: 1,
      name: 'Старое имя',
      category_id: '2',
      price: '100',
      discount_price: '',
      stock: '5',
      description: '',
      images: [],
    };
    const categoriesData = [{ id: '2', name: 'Категория 2' }];

    axios.get
      .mockResolvedValueOnce({ data: productData })
      .mockResolvedValueOnce({ data: categoriesData });

    axios.put.mockResolvedValueOnce({});

    renderComponent();
    await screen.findByTestId('admin-product-edit-form');

    // Изменяем название
    const nameInput = screen.getByTestId('product-name-input');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Новое имя');

    // Изменяем цену
    const priceInput = screen.getByTestId('product-price-input');
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, '150');

    // Нажимаем сохранить
    await userEvent.click(screen.getByTestId('save-button'));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/admin/products/1'),
        expect.objectContaining({
          name: 'Новое имя',
          price: '150',
          category_id: '2',
          discount_price: '',
          stock: '5',
          description: '',
          images: [],
        }),
        expect.objectContaining({
          headers: { Authorization: 'Bearer null' } // localStorage.getItem('token') вернёт null в тестах, можно замокать
        })
      );
    });

    // После успешного сохранения должен быть вызван navigate
    expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
  });

  it('cancel button navigates back to products', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { id: 1, name: 'A', category_id: '1', price: '1', stock: '1' } })
      .mockResolvedValueOnce({ data: [] });

    renderComponent();
    await screen.findByTestId('admin-product-edit-form');

    await userEvent.click(screen.getByTestId('cancel-button'));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/products');
  });
});