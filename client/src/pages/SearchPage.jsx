import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import Breadcrumb from '../components/Breadcrumb';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSearchResults = async (page = 1) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/products?search=${encodeURIComponent(query)}&page=${page}&limit=12`
      );
      if (!response.ok) throw new Error('Ошибка поиска');
      const data = await response.json();
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error(error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchSearchResults(1);
  }, [query]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchSearchResults(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!query) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb />
        <div className="text-center py-12">
          <p className="text-gray-600">Введите поисковый запрос</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb />
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">
          Результаты поиска: "{query}"
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
          >
            ← Назад
          </button>
          <Link
            to="/"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            На главную
          </Link>
        </div>
      </div>
      <p className="text-gray-600 mb-8">Найдено товаров: {pagination.totalItems}</p>

      {loading ? (
        <div className="text-center py-12">Загрузка...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">Ничего не найдено. Попробуйте другой запрос.</p>
          <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">
            Вернуться в каталог
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SearchPage;