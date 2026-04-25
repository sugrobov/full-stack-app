import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const FavoritesPage = () => {
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Избранное</h1>
        <div className="text-center py-12">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Избранное</h1>
      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">У вас пока нет избранных товаров.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">Перейти в каталог</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;