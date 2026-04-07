import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts, fetchCategories, setCurrentPage } from '../store/productsSlice';
import ProductCard from '../components/ProductCard';
import Breadcrumb from '../components/Breadcrumb';
import Filters from '../components/Filters';
import Pagination from '../components/Pagination';

const HomePage = () => {
  const dispatch = useDispatch();
  const { items, status, currentPage, totalPages, totalItems, searchQuery, selectedCategory, minPrice, maxPrice } = useSelector(state => state.products);

  // Загружаем товары при изменении фильтров или страницы
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch, currentPage, searchQuery, selectedCategory, minPrice, maxPrice]);

  // Загружаем категории один раз при монтировании
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-500 text-lg mb-4">Ошибка загрузки товаров</div>
          <button
            onClick={() => dispatch(fetchProducts())}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Повторить попытку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb />
      </div>

      <h1 className="text-3xl font-bold text-gray-800 mb-2">Каталог товаров</h1>
      <p className="text-gray-600 mb-8">Найдено товаров: {totalItems}</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Filters />
        </div>

        <div className="lg:col-span-3">
          {items.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Товары не найдены</h3>
              <p className="text-gray-600">Попробуйте изменить параметры фильтрации</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="mt-8 flex justify-center">
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;