import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProductImageUpload from '../Products/components/ProductImageUpload'; // компонент загрузки изображения

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  console.log('AdminProductEdit mounted, id:', id);

  // Поля формы
  const [name, setName] = useState('');
  const [category_id, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [discount_price, setDiscountPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Fetching product', id, 'token:', token ? 'present' : 'missing');
        // получаем товар
        const productRes = await axios.get(`${API_URL}/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Product response:', productRes.data);
        const p = productRes.data;
        console.log('Setting state with:', { name: p.name, category_id: p.category_id, price: p.price, stock: p.stock });
        setProduct(p);
        setName(p.name);
        setCategoryId(p.category_id);
        setPrice(parseFloat(p.price) || '');
        setDiscountPrice(p.discount_price ? parseFloat(p.discount_price) : '');
        setStock(parseInt(p.stock) || '');
        setDescription(p.description || '');
        // Безопасная установка изображения: используем первое изображение из массива или основное image
        let firstImage = '';
        if (p.images && Array.isArray(p.images) && p.images.length > 0) {
          firstImage = p.images[0];
        } else if (p.image) {
          firstImage = p.image;
        }
        // console.log('First image:', firstImage);
        setImages(p.images || []);

        // получаем категории с проверкой на массив
        const catRes = await axios.get(`${API_URL}/categories`);
        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
      } catch (err) {
        console.error('Error fetching product:', err.response ? err.response.status : err.message);
        alert('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  /*   const handleImageUploaded = (newUrl) => {
      setImageUrl(newUrl);
    }; */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/admin/products/${id}`, {
        name, category_id, price, discount_price, stock: String(stock), description, images
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Товар сохранён');
      console.log('Submitting images:', images);
      navigate('/admin/products');
    } catch (err) {
      console.error(err);
      alert('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8" data-testid="loading-message">Загрузка...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" data-testid="admin-product-edit-heading">
        Редактирование товара
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl" data-testid="admin-product-edit-form">
        {/* Блок изображения */}
        <div data-testid="image-upload-section">
          <label className="block font-medium mb-2">Изображение товара</label>
          <ProductImageUpload
            productId={id}
            images={images}
            onImagesChanged={setImages}
          />
        </div>

        <div>
          <label htmlFor="product-name" className="block font-medium mb-1">Название</label>
          <input
            id="product-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            data-testid="product-name-input"
          />
        </div>

        <div>
          <label htmlFor="product-category" className="block font-medium mb-1">Категория</label>
          <select
            id="product-category"
            value={category_id}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            data-testid="product-category-select"
          >
            <option value="">Выберите категорию</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="product-price" className="block font-medium mb-1">Цена</label>
            <input
              id="product-price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
              data-testid="product-price-input"
            />
          </div>
          <div>
            <label htmlFor="product-discount-price" className="block font-medium mb-1">Цена со скидкой</label>
            <input
              id="product-discount-price"
              type="number"
              value={discount_price}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className="w-full border rounded px-3 py-2"
              data-testid="product-discount-price-input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="product-stock" className="block font-medium mb-1">Количество на складе</label>
          <input
            id="product-stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
            data-testid="product-stock-input"
          />
        </div>

        <div>
          <label htmlFor="product-description" className="block font-medium mb-1">Описание</label>
          <textarea
            id="product-description"
            rows="5"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
            data-testid="product-description-textarea"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            data-testid="save-button"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            data-testid="cancel-button"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductEdit;