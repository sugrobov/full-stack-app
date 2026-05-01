import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

const AdminReviews = () => {
  const { token } = useSelector(state => state.auth);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: '', is_approved: 1 });
  const [filters, setFilters] = useState({
    productId: '',
    userId: '',
    minRating: '',
    maxRating: '',
    search: '',
    is_approved: ''
  });

  useEffect(() => {
    fetchReviews();
  }, [page, filters]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(filters.productId && { productId: filters.productId }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.minRating && { minRating: filters.minRating }),
        ...(filters.maxRating && { maxRating: filters.maxRating }),
        ...(filters.search && { search: filters.search }),
        ...(filters.is_approved !== '' && { is_approved: filters.is_approved })
      });
      const res = await axios.get(`${API_URL}/admin/reviews?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(res.data.reviews);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Ошибка загрузки отзывов:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(reviews.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Удалить ${selectedIds.length} отзыв(ов)?`)) return;
    try {
      await axios.delete(`${API_URL}/admin/reviews/bulk`, {
        data: { ids: selectedIds },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedIds([]);
      fetchReviews();
    } catch (err) {
      console.error('Ошибка массового удаления:', err);
    }
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setEditForm({ rating: review.rating, comment: review.comment || '', is_approved: review.is_approved });
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API_URL}/admin/reviews/${editingReview.id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingReview(null);
      fetchReviews();
    } catch (err) {
      console.error('Ошибка обновления:', err);
    }
  };

  const handleToggleApprove = async (id, currentStatus) => {
    try {
      await axios.patch(`${API_URL}/admin/reviews/${id}/toggle-approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReviews();
    } catch (err) {
      console.error('Ошибка переключения статуса:', err);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ productId: '', userId: '', minRating: '', maxRating: '', search: '', is_approved: '' });
    setPage(1);
  };

  const handleDeleteSingle = async (id) => {
  if (!window.confirm('Удалить отзыв?')) return;
  try {
    await axios.delete(`${API_URL}/admin/reviews/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    toast.success('Товар удалён');
    fetchReviews();
  } catch (err) {
    console.error('Ошибка удаления:', err);
  }
};

  if (loading) return <div className="text-center py-8">Загрузка отзывов...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Управление отзывами</h1>

      {/* Фильтры */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Фильтры</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input type="text" name="productId" placeholder="ID товара" value={filters.productId} onChange={handleFilterChange} className="border p-2 rounded" />
          <input type="text" name="userId" placeholder="ID пользователя" value={filters.userId} onChange={handleFilterChange} className="border p-2 rounded" />
          <input type="text" name="search" placeholder="Поиск (товар, пользователь, комментарий)" value={filters.search} onChange={handleFilterChange} className="border p-2 rounded" />
          <input type="number" name="minRating" placeholder="Рейтинг от" value={filters.minRating} onChange={handleFilterChange} className="border p-2 rounded" step="1" min="1" max="5" />
          <input type="number" name="maxRating" placeholder="Рейтинг до" value={filters.maxRating} onChange={handleFilterChange} className="border p-2 rounded" step="1" min="1" max="5" />
          <select name="is_approved" value={filters.is_approved} onChange={handleFilterChange} className="border p-2 rounded">
            <option value="">Все статусы</option>
            <option value="1">Одобренные</option>
            <option value="0">Скрытые</option>
          </select>
        </div>
        <div className="mt-4 flex gap-4">
          <button onClick={resetFilters} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Сбросить фильтры</button>
          <button onClick={handleBulkDelete} disabled={selectedIds.length === 0} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50">Удалить выбранные ({selectedIds.length})</button>
        </div>
      </div>

      {/* Таблица отзывов */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === reviews.length && reviews.length > 0} />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Товар</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Пользователь</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Рейтинг</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Комментарий</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Дата</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reviews.map(review => (
              <tr key={review.id} className={review.is_approved === 0 ? 'bg-gray-100' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="checkbox" checked={selectedIds.includes(review.id)} onChange={() => handleSelect(review.id)} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{review.product_name} (ID:{review.product_id})</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{review.user_name}<br/><span className="text-xs">{review.user_email}</span></td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{review.comment || '—'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${review.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {review.is_approved ? 'Одобрен' : 'Скрыт'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleEdit(review)} className="text-blue-600 hover:text-blue-900 mr-3">Ред.</button>
                  <button onClick={() => handleToggleApprove(review.id, review.is_approved)} className="text-purple-600 hover:text-purple-900 mr-3">
                    {review.is_approved ? 'Скрыть' : 'Показать'}
                  </button>
                  <button onClick={() => handleDeleteSingle(review.id)} className="text-red-600 hover:text-red-900">Уд.</button>
                </td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1 border rounded disabled:opacity-50">←</button>
          <span className="px-3 py-1">Стр. {page} из {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p+1)} className="px-3 py-1 border rounded disabled:opacity-50">→</button>
        </div>
      )}

      {/* Модалка редактирования */}
      {editingReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Редактировать отзыв</h2>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Рейтинг</label>
              <select value={editForm.rating} onChange={(e) => setEditForm({...editForm, rating: parseInt(e.target.value)})} className="border p-2 rounded w-full">
                {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} звезды</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Комментарий</label>
              <textarea value={editForm.comment} onChange={(e) => setEditForm({...editForm, comment: e.target.value})} rows="3" className="border p-2 rounded w-full"></textarea>
            </div>
            <div className="mb-3">
              <label className="flex items-center">
                <input type="checkbox" checked={editForm.is_approved === 1} onChange={(e) => setEditForm({...editForm, is_approved: e.target.checked ? 1 : 0})} className="mr-2" />
                Одобрен
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingReview(null)} className="px-4 py-2 border rounded">Отмена</button>
              <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded">Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;