import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const AdminProducts = () => {
  const { token } = useSelector(state => state.auth);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    discount_price: '',
    rating: '',
    stock: '',
    description: '',
    images: []
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Ошибка загрузки товаров:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      if (Array.isArray(res.data)) {
        setCategories(res.data);
      } else {
        console.error('Категории не массив:', res.data);
        setCategories([]);
      }
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
      setCategories([]);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/admin/products/${editingProduct.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/admin/products`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setEditingProduct(null);
      setFormData({ name: '', category_id: '', price: '', discount_price: '', rating: '', stock: '', description: '', images: [] });
      fetchProducts();
    } catch (err) {
      console.error('Ошибка сохранения товара:', err);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id,
      price: product.price,
      discount_price: product.discount_price || '',
      rating: product.rating || '',
      stock: product.stock,
      description: product.description || '',
      images: []
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Удалить товар?')) {
      try {
        await axios.delete(`${API_URL}/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProducts();
      } catch (err) {
        console.error('Ошибка удаления:', err);
      }
    }
  };

  if (loading) return <div className="text-center py-8">Загрузка...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Управление товарами</h1>

      {/* Форма */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">{editingProduct ? 'Редактировать товар' : 'Добавить товар'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="name" placeholder="Название" value={formData.name} onChange={handleInputChange} className="border p-2 rounded" required />
          <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="border p-2 rounded" required>
            <option value="">Выберите категорию</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input type="number" name="price" placeholder="Цена" value={formData.price} onChange={handleInputChange} className="border p-2 rounded" required />
          <input type="number" name="discount_price" placeholder="Цена со скидкой" value={formData.discount_price} onChange={handleInputChange} className="border p-2 rounded" />
          <input type="number" step="0.1" name="rating" placeholder="Рейтинг (1-5)" value={formData.rating} onChange={handleInputChange} className="border p-2 rounded" />
          <input type="number" name="stock" placeholder="Количество" value={formData.stock} onChange={handleInputChange} className="border p-2 rounded" required />
          <textarea name="description" placeholder="Описание" value={formData.description} onChange={handleInputChange} className="border p-2 rounded md:col-span-2" rows="3"></textarea>
          <div className="md:col-span-2 flex gap-4">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Сохранить</button>
            {editingProduct && (
              <button type="button" onClick={() => { setEditingProduct(null); setFormData({ name: '', category_id: '', price: '', discount_price: '', rating: '', stock: '', description: '', images: [] }); }} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Отмена</button>
            )}
          </div>
        </form>
      </div>

      {/* Таблица товаров */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Категория</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Скидка</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Рейтинг</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Остаток</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.price} ₽</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.discount_price || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.rating || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stock}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900 mr-4">Редактировать</button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProducts;