import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';
import TableSkeleton from '../../components/UI/TableSkeleton';

const API_URL = import.meta.env.VITE_API_URL;

const AdminProducts = () => {
  const { token } = useSelector(state => state.auth);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
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

  // Состояния фильтров
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, search, selectedCategory, minPrice, maxPrice]);

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
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Ошибка загрузки категорий:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];
    if (search) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_id === parseInt(selectedCategory));
    }
    if (minPrice) {
      const min = parseFloat(minPrice);
      filtered = filtered.filter(p => (p.discount_price || p.price) >= min);
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      filtered = filtered.filter(p => (p.discount_price || p.price) <= max);
    }
    setFilteredProducts(filtered);
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
      toast.success(editingProduct ? 'Товар обновлён' : 'Товар добавлен');
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
        toast.success('Товар удалён');
        fetchProducts();
      } catch (err) {
        console.error('Ошибка удаления:', err);
      }
    }
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
  };

  if (loading) return <TableSkeleton columns={8} rows={5} />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Управление товарами</h1>

      {/* Форма добавления/редактирования */}
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

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Фильтры</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" placeholder="Поиск по названию" value={search} onChange={(e) => setSearch(e.target.value)} className="border p-2 rounded" />
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="border p-2 rounded">
            <option value="">Все категории</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input type="number" placeholder="Цена от (₽)" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="border p-2 rounded" />
          <input type="number" placeholder="Цена до (₽)" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="border p-2 rounded" />
        </div>
        <div className="mt-4">
          <button onClick={resetFilters} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Сбросить фильтры</button>
        </div>
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
            {filteredProducts.map(product => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.price} ₽</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.discount_price || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.rating || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.stock}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900 mr-4">Ред.</button>
                  <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">Уд.</button>
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