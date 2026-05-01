import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const Reviews = ({ productId }) => {
  const { user, token } = useSelector(state => state.auth);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${API_URL}/products/${productId}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('Войдите, чтобы оставить отзыв');
      return;
    }
    try {
      await axios.post(`${API_URL}/products/${productId}/reviews`, { rating, comment }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRating(5);
      setComment('');
      fetchReviews();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки отзыва');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Удалить отзыв?')) return;
    try {
      await axios.delete(`${API_URL}/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReviews();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-4">Загрузка отзывов...</div>;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Отзывы</h2>
      {reviews.length === 0 && (
        <p className="text-gray-500 mb-4">Пока нет отзывов. Будьте первым!</p>
      )}
      <div className="space-y-4 mb-8">
        {reviews.map(review => (
          <div key={review.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{review.user_name}</div>
                <div className="flex items-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mt-2">{review.comment}</p>
                <div className="text-xs text-gray-400 mt-2">{new Date(review.created_at).toLocaleDateString()}</div>
              </div>
              {(user?.id === review.user_id || user?.role === 'admin') && (
                <button onClick={() => handleDelete(review.id)} className="text-red-500 hover:text-red-700 text-sm">
                  Удалить
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-3">Оставить отзыв</h3>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Оценка</label>
            <div className="flex space-x-2">
              {[1,2,3,4,5].map(star => (
                <button type="button" key={star} onClick={() => setRating(star)} className="focus:outline-none">
                  <svg className={`w-6 h-6 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 fill-current'}`} viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Комментарий</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows="3" className="w-full border rounded px-3 py-2" placeholder="Ваш отзыв..."></textarea>
          </div>
          {error && <div className="text-red-500 mb-3">{error}</div>}
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Отправить</button>
        </form>
      ) : (
        <div className="bg-gray-100 p-4 rounded text-center">
          <p>Войдите, чтобы оставить отзыв.</p>
        </div>
      )}
    </div>
  );
};

export default Reviews;