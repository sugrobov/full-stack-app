import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { removeFromFavorites } from '../store/favoritesSlice';

const FavoritesPage = () => {
  const dispatch = useDispatch();
  const { items: favoriteIds } = useSelector(state => state.favorites);
  const { token } = useSelector(state => state.auth);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (favoriteIds && favoriteIds.length) {
      setLoading(true);
      axios.post(`${import.meta.env.VITE_API_URL}/products/by-ids`, { ids: favoriteIds }, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setProducts(res.data))
        .catch(err => console.error('Failed to load favorites:', err))
        .finally(() => setLoading(false));
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [favoriteIds, token]);

  const handleRemove = (id) => {
    dispatch(removeFromFavorites(id));
    // Удаляем товар из локального состояния (чтобы сразу исчез без перезагрузки)
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Избранное</h1>
        <div className="text-center py-12" role="status" aria-busy="true" data-testid="loading-message">Загрузка...</div>
      </div>
    );
  }

    return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Избранное</h1>
      {products.length === 0 ? (
        <div
          className="text-center py-12"
          role="status"
          data-testid="empty-message"
        >
          <p className="text-gray-600">У вас пока нет избранных товаров.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none p-0">
          {products.map(product => (
            <li key={product.id} className="relative">
              <ProductCard product={product} />
              <button
                onClick={() => handleRemove(product.id)}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition z-10"
                aria-label={`Удалить ${product.name} из избранного`}
                data-testid={`remove-favorite-${product.id}`}
              >
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FavoritesPage;